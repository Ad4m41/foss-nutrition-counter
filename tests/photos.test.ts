import { Platform } from 'react-native';
import {
  pickPhoto,
  pickPhotos,
  recoverPhoto,
  disposePhoto,
} from '../src/services/photos';
import * as ImagePicker from 'expo-image-picker';

const mockFiles = new Map<string, string>();
const mockCopy = jest.fn(async (source: string, destination: string) => {
  mockFiles.set(destination, mockFiles.get(source)!);
});
const mockContextRelease = jest.fn();
const mockImageRelease = jest.fn();
const mockSave = jest.fn();
const mockRender = jest.fn();
const mockResize = jest.fn();
let mockPhotoId = 0;
jest.mock('expo-crypto', () => ({
  randomUUID: () =>
    mockPhotoId++ === 0 ? 'draft-photo' : `draft-photo-${mockPhotoId}`,
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  getPendingResultAsync: jest.fn(),
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: {
    manipulate: () => ({
      resize: mockResize,
      renderAsync: mockRender,
      release: mockContextRelease,
    }),
  },
  SaveFormat: { JPEG: 'jpeg' },
}));
jest.mock('expo-file-system', () => ({
  Paths: {
    document: { uri: 'file:///documents' },
    cache: { uri: 'file:///cache' },
  },
  Directory: class {
    uri: string;
    constructor(base: { uri: string }, name: string) {
      this.uri = `${base.uri}/${name}`;
    }
    create() {}
  },
  File: class {
    uri: string;
    constructor(base: string | { uri: string }, name?: string) {
      this.uri = typeof base === 'string' ? base : `${base.uri}/${name}`;
    }
    get exists() {
      return mockFiles.has(this.uri);
    }
    copy(destination: { uri: string }) {
      return mockCopy(this.uri, destination.uri);
    }
    delete() {
      mockFiles.delete(this.uri);
    }
  },
}));
const selected = {
  canceled: false,
  assets: [{ uri: 'file:///cache/camera.jpg', width: 4000, height: 3000 }],
} as ImagePicker.ImagePickerResult;
beforeEach(() => {
  mockPhotoId = 0;
  Platform.OS = 'android';
  mockFiles.clear();
  mockFiles.set('file:///cache/processed.jpg', 'photo');
  mockCopy.mockClear().mockImplementation(async (source, destination) => {
    mockFiles.set(destination, mockFiles.get(source)!);
  });
  mockRender.mockResolvedValue({
    saveAsync: mockSave,
    release: mockImageRelease,
  });
  mockSave.mockResolvedValue({
    uri: 'file:///cache/processed.jpg',
    width: 1280,
    height: 960,
    base64: 'image',
  });
  jest
    .mocked(ImagePicker.requestCameraPermissionsAsync)
    .mockResolvedValue({ granted: true } as never);
  jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValue(selected);
  jest.mocked(ImagePicker.getPendingResultAsync).mockResolvedValue(selected);
});
test('camera returns a durable draft only after its async copy finishes, then releases bitmap memory', async () => {
  let finish!: () => void;
  mockCopy.mockImplementation(
    (source, destination) =>
      new Promise<void>((resolve) => {
        finish = () => {
          mockFiles.set(destination, mockFiles.get(source)!);
          resolve();
        };
      }),
  );
  const picking = pickPhoto(true);
  for (let i = 0; i < 8; i++) await Promise.resolve();
  expect(mockImageRelease).not.toHaveBeenCalled();
  finish();
  const result = await picking;
  expect(result?.uri).toBe(
    'file:///documents/meal-photo-drafts/draft-photo.jpg',
  );
  expect(mockFiles.get(result!.uri)).toBe('photo');
  expect(mockFiles.has('file:///cache/processed.jpg')).toBe(false);
  expect(mockResize).toHaveBeenCalledWith({ width: 1280 });
  expect(mockImageRelease).toHaveBeenCalledTimes(1);
  expect(mockContextRelease).toHaveBeenCalledTimes(1);
});
test('recovers a lost Android result without relaunching the camera', async () => {
  expect((await recoverPhoto())?.base64).toBe('image');
  expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
});
test('a failed copy propagates and releases native images', async () => {
  mockCopy.mockRejectedValue(new Error('Disk full'));
  await expect(pickPhoto(true)).rejects.toThrow('Disk full');
  expect(mockImageRelease).toHaveBeenCalledTimes(1);
  expect(mockContextRelease).toHaveBeenCalledTimes(1);
});
test('disposing an editor photo can never delete a retained meal photo', () => {
  const saved = 'file:///documents/meal-photos/saved.jpg';
  mockFiles.set(saved, 'saved photo');
  disposePhoto(saved);
  expect(mockFiles.get(saved)).toBe('saved photo');
});
test('cancelling the camera does not process a photo', async () => {
  jest
    .mocked(ImagePicker.launchCameraAsync)
    .mockResolvedValue({ canceled: true, assets: null });
  expect(await pickPhoto(true)).toBeNull();
  expect(mockRender).not.toHaveBeenCalled();
});

test('gallery multi-selection prepares every image sequentially with the remaining limit', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [
      selected.assets![0],
      { ...selected.assets![0], uri: 'file:///cache/label.jpg' },
    ],
  });
  mockSave
    .mockResolvedValueOnce({
      uri: 'file:///cache/processed.jpg',
      base64: 'dish',
    })
    .mockResolvedValueOnce({
      uri: 'file:///cache/second.jpg',
      base64: 'label',
    });
  mockFiles.set('file:///cache/second.jpg', 'label photo');
  const photos = await pickPhotos(false, 2);
  expect(photos.map((photo) => photo.base64)).toEqual(['dish', 'label']);
  expect(new Set(photos.map((photo) => photo.uri)).size).toBe(2);
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      allowsMultipleSelection: true,
      selectionLimit: 2,
    }),
  );
  expect(mockImageRelease).toHaveBeenCalledTimes(2);
});
