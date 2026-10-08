import { MAX_MEAL_PHOTOS } from '../core/nutrition';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { Directory, File, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
export async function pickPhoto(camera: boolean) {
  return (await pickPhotos(camera, 1))[0] ?? null;
}

export async function pickPhotos(camera: boolean, limit: number) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('cameraPermission');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
    ...(!camera
      ? {
          allowsMultipleSelection: limit > 1,
          selectionLimit: limit,
          orderedSelection: true,
        }
      : {}),
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  return preparePhotos(result, limit);
}

export async function recoverPhoto() {
  return (await recoverPhotos())[0] ?? null;
}

export async function recoverPhotos() {
  if (Platform.OS !== 'android') return [];
  const result = await ImagePicker.getPendingResultAsync();
  if (!result) return [];
  if ('code' in result) throw new Error('photoError');
  return preparePhotos(result, MAX_MEAL_PHOTOS);
}

async function preparePhotos(
  result: ImagePicker.ImagePickerResult,
  limit: number,
) {
  if (result.canceled) return [];
  const photos: Awaited<ReturnType<typeof preparePhoto>>[] = [];
  try {
    // Decode one bitmap at a time to bound native memory use.
    for (const asset of result.assets.slice(0, limit))
      photos.push(await preparePhoto(asset));
    return photos;
  } catch (error) {
    for (const photo of photos) disposePhoto(photo.uri);
    throw error;
  }
}

async function preparePhoto(asset: ImagePicker.ImagePickerAsset) {
  if (!asset?.uri) throw new Error('photoError');
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1280) {
    context.resize(
      asset.width >= asset.height ? { width: 1280 } : { height: 1280 },
    );
  }
  try {
    const rendered = await context.renderAsync();
    try {
      const photo = await rendered.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.75,
        base64: true,
      });
      if (!photo.base64) throw new Error('photoError');
      if (Platform.OS === 'web') return photo;
      // The OS can evict image-picker/manipulator cache while AI is running.
      const directory = new Directory(Paths.document, 'meal-photo-drafts');
      directory.create({ idempotent: true, intermediates: true });
      const retained = new File(directory, `${randomUUID()}.jpg`);
      try {
        await new File(photo.uri).copy(retained);
        if (!retained.exists) throw new Error('photoError');
      } catch (error) {
        if (retained.exists) retained.delete();
        throw error;
      }
      disposePhoto(photo.uri);
      return { ...photo, uri: retained.uri };
    } finally {
      rendered.release();
    }
  } finally {
    context.release();
  }
}

export function disposePhoto(uri: string) {
  try {
    if (Platform.OS === 'web') {
      if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    } else {
      // Cleanup owns drafts/cache only, never a photo belonging to a saved meal.
      const owned = [
        Paths.cache.uri,
        new Directory(Paths.document, 'meal-photo-drafts').uri,
      ].some((base) => uri.startsWith(base.replace(/\/$/, '') + '/'));
      if (!owned) return;
      const file = new File(uri);
      if (file.exists) file.delete();
    }
  } catch {
    /* The OS may have already evicted this cache file. */
  }
}

/** Read a retained meal photo only when the user requests another estimate. */
export async function photoBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return new File(uri).base64();
  const response = await fetch(uri);
  if (!response.ok) throw new Error('photoError');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(new Error('photoError'));
    reader.readAsDataURL(blob);
  });
}
