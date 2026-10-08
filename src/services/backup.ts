import { mealPhotos } from '../core/nutrition';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  Backup,
  MAX_BACKUP_BYTES,
  parseBackup,
  validateBackup,
} from '../core/backup';

export async function photoForBackup(uri: string) {
  const file = new File(uri);
  if (file.size > MAX_BACKUP_BYTES) throw new Error('Photo too large');
  return `data:image/${uri.endsWith('.png') ? 'png' : 'jpeg'};base64,${await file.base64()}`;
}
export async function shareBackup(
  data: Omit<Backup, 'format' | 'version' | 'createdAt'>,
) {
  const meals = [];
  for (const meal of data.meals) {
    const uris = [];
    for (const uri of mealPhotos(meal)) uris.push(await photoForBackup(uri));
    meals.push({
      ...meal,
      photoUri: uris[0],
      ...(meal.photoUris ? { photoUris: uris } : {}),
    });
  }
  const backup = validateBackup({
    ...data,
    meals,
    format: 'meal-diary',
    version: 1,
    createdAt: new Date().toISOString(),
  });
  const json = JSON.stringify(backup);
  if (json.length > MAX_BACKUP_BYTES) throw new Error('Backup too large');
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('Sharing unavailable');
  const file = new File(Paths.cache, `meal-diary-backup-${Date.now()}.json`);
  try {
    file.write(json);
    if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup too large');
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  } finally {
    if (file.exists) file.delete();
  }
}
export async function pickBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  try {
    if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup too large');
    return parseBackup(await file.text());
  } finally {
    if (file.exists) file.delete();
  }
}
