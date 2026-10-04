export const RELEASE_REPO = 'Ad4m41/foss-nutrition-counter';
export const RELEASES_URL = `https://github.com/${RELEASE_REPO}/releases`;
export const APP_ID = 'org.fossnutrition.mealdiary';
export type AppRelease = {
  version: string;
  url: string;
  apk: string;
  notes: string;
};
export function parseVersion(value: string) {
  const match =
    /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z.-]+)?$/.exec(
      value,
    );
  if (!match) return null;
  const core = match.slice(1, 4).map(Number);
  const pre = match[4]?.split('.') ?? [];
  if (
    core.some((n) => !Number.isSafeInteger(n)) ||
    pre.some((s) => /^0\d+$/.test(s))
  )
    return null;
  return { core, pre };
}
export function compareVersions(a: string, b: string): number {
  const left = parseVersion(a),
    right = parseVersion(b);
  if (!left || !right) throw new Error('Invalid version');
  for (let i = 0; i < 3; i++)
    if (left.core[i] !== right.core[i])
      return left.core[i] > right.core[i] ? 1 : -1;
  if (!left.pre.length || !right.pre.length)
    return left.pre.length === right.pre.length ? 0 : left.pre.length ? -1 : 1;
  for (let i = 0; i < Math.max(left.pre.length, right.pre.length); i++) {
    const x = left.pre[i],
      y = right.pre[i];
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    if (x === y) continue;
    const nx = /^\d+$/.test(x),
      ny = /^\d+$/.test(y);
    if (nx && ny)
      return x.length !== y.length
        ? x.length > y.length
          ? 1
          : -1
        : x > y
          ? 1
          : -1;
    if (nx !== ny) return nx ? -1 : 1;
    return x > y ? 1 : -1;
  }
  return 0;
}
export function findUpdate(data: unknown, current: string): AppRelease | null {
  const installed = parseVersion(current);
  if (!installed || !Array.isArray(data))
    throw new Error('Invalid release data');
  let newest: AppRelease | null = null;
  for (const item of data) {
    if (
      !item ||
      typeof item !== 'object' ||
      item.draft ||
      typeof item.tag_name !== 'string' ||
      !Array.isArray(item.assets)
    )
      continue;
    const parsed = parseVersion(item.tag_name);
    if (
      !parsed ||
      (!installed.pre.length && (item.prerelease || parsed.pre.length)) ||
      compareVersions(item.tag_name, current) <= 0
    )
      continue;
    const prefix = `${RELEASES_URL}/download/${encodeURIComponent(item.tag_name)}/`;
    const asset = item.assets.find(
      (a: { name?: unknown; browser_download_url?: unknown }) =>
        typeof a?.name === 'string' &&
        a.name.endsWith('.apk') &&
        typeof a.browser_download_url === 'string' &&
        a.browser_download_url === prefix + encodeURIComponent(a.name),
    );
    if (!asset) continue;
    const candidate = {
      version: item.tag_name.replace(/^v/, ''),
      url: `${RELEASES_URL}/tag/${encodeURIComponent(item.tag_name)}`,
      apk: asset.browser_download_url,
      notes: typeof item.body === 'string' ? item.body : '',
    };
    if (!newest || compareVersions(candidate.version, newest.version) > 0)
      newest = candidate;
  }
  return newest;
}
