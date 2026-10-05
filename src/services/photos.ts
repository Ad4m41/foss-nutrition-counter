import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
export async function pickPhoto(camera: boolean) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('cameraPermission');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 1280) {
    context.resize(
      asset.width >= asset.height ? { width: 1280 } : { height: 1280 },
    );
  }
  const rendered = await context.renderAsync();
  return rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.75,
    base64: true,
  });
}

export function disposePhoto(uri: string) {
  try {
    if (Platform.OS === 'web') {
      if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);
    } else {
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
