import {
  Backup,
  MAX_BACKUP_BYTES,
  parseBackup,
  validateBackup,
} from '../core/backup';
export async function shareBackup(
  data: Omit<Backup, 'format' | 'version' | 'createdAt'>,
) {
  const backup = validateBackup({
    ...data,
    format: 'meal-diary',
    version: 1,
    createdAt: new Date().toISOString(),
  });
  const json = JSON.stringify(backup);
  const blob = new Blob([json], { type: 'application/json' });
  if (blob.size > MAX_BACKUP_BYTES) throw new Error('Backup too large');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `meal-diary-backup-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function pickBackup() {
  return new Promise<Backup | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener(
      'cancel',
      () => {
        input.remove();
        resolve(null);
      },
      { once: true },
    );
    input.addEventListener(
      'change',
      async () => {
        try {
          const file = input.files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          if (file.size > MAX_BACKUP_BYTES) throw new Error('Backup too large');
          resolve(parseBackup(await file.text()));
        } catch (error) {
          reject(error);
        } finally {
          input.remove();
        }
      },
      { once: true },
    );
    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
  });
}
