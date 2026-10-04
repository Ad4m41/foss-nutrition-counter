import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { APP_ID, RELEASE_REPO, findUpdate } from '../core/releases';
export function installedVersion() {
  return (
    (Application.applicationId === APP_ID
      ? Application.nativeApplicationVersion
      : null) ??
    Constants.expoConfig?.version ??
    '0.0.0'
  );
}
export async function checkForUpdate(version = installedVersion()) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://api.github.com/repos/${RELEASE_REPO}/releases?per_page=30`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/vnd.github+json' },
      },
    );
    if (!response.ok) throw new Error('Release check failed');
    return findUpdate(await response.json(), version);
  } finally {
    clearTimeout(timeout);
  }
}
