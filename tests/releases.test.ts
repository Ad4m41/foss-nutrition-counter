import {
  RELEASES_URL,
  compareVersions,
  findUpdate,
  parseVersion,
} from '../src/core/releases';
const release = (version: string, extra = {}) => ({
  tag_name: `v${version}`,
  draft: false,
  prerelease: version.includes('-'),
  assets: [
    {
      name: 'app.apk',
      browser_download_url: `${RELEASES_URL}/download/v${version}/app.apk`,
    },
  ],
  ...extra,
});
test('semantic version order includes numerical beta identifiers and stable precedence', () => {
  const versions = [
    '0.2.0-beta.1',
    '0.2.0-beta.2',
    '0.2.0-beta.10',
    '0.2.0',
    '0.10.0',
    '1.0.0',
  ];
  versions
    .slice(1)
    .forEach((version, i) =>
      expect(compareVersions(version, versions[i])).toBe(1),
    );
  expect(compareVersions('v1.0.0+build.2', '1.0.0+build.1')).toBe(0);
  expect(parseVersion('1.0.0-beta.01')).toBeNull();
  expect(parseVersion('hello')).toBeNull();
});
test('stable users only see newer stable releases with an APK', () => {
  expect(
    findUpdate(
      [
        release('0.3.0-beta.1'),
        release('0.2.1'),
        release('0.4.0', { assets: [] }),
        release('0.5.0', { draft: true }),
      ],
      '0.2.0',
    )?.version,
  ).toBe('0.2.1');
  expect(findUpdate([release('0.2.0')], '0.2.0')).toBeNull();
});
test('beta users can update to later betas and the stable version', () => {
  expect(
    findUpdate(
      [release('0.2.0-beta.10'), release('0.2.0-beta.2')],
      '0.2.0-beta.1',
    )?.version,
  ).toBe('0.2.0-beta.10');
  expect(
    findUpdate([release('0.2.0'), release('0.2.0-beta.10')], '0.2.0-beta.1')
      ?.version,
  ).toBe('0.2.0');
});
test('untrusted asset origins and unrelated repository paths are never offered', () => {
  for (const url of [
    'https://evil.example/app.apk',
    `${RELEASES_URL}/download/v0.2.1/../app.apk`,
    'https://github.com/another/repo/releases/download/v0.2.1/app.apk',
  ]) {
    expect(
      findUpdate(
        [
          release('0.2.1', {
            assets: [{ name: 'app.apk', browser_download_url: url }],
          }),
        ],
        '0.2.0',
      ),
    ).toBeNull();
  }
});
