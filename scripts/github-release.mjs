import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const builds = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const tag = process.argv[3];
execFileSync(process.execPath, ['scripts/check-release.mjs', tag], {
  stdio: 'inherit',
});
const build = Array.isArray(builds) ? builds[0] : builds;
const url = build.artifacts?.applicationArchiveUrl ?? build.artifacts?.buildUrl;
if (
  build.status !== 'FINISHED' ||
  build.platform !== 'ANDROID' ||
  build.appIdentifier !== 'org.fossnutrition.mealdiary' ||
  build.appVersion !== tag.slice(1) ||
  typeof url !== 'string' ||
  !url.startsWith('https://')
)
  throw new Error('No successful matching APK build.');
const name = `nutrition-counter-${tag.slice(1)}.apk`;
execFileSync(
  'curl',
  ['--fail', '--location', '--retry', '3', '--output', name, url],
  { stdio: 'inherit' },
);
const apk = readFileSync(name);
if (apk.subarray(0, 2).toString() !== 'PK')
  throw new Error('Artifact is not an APK archive.');
writeFileSync(
  'SHA256SUMS.txt',
  `${createHash('sha256').update(apk).digest('hex')}  ${name}\n`,
);
let existing = false;
try {
  execFileSync('gh', ['release', 'view', tag], { stdio: 'ignore' });
  existing = true;
} catch {}
if (existing) {
  const release = JSON.parse(
    execFileSync('gh', ['release', 'view', tag, '--json', 'isDraft'], {
      encoding: 'utf8',
    }),
  );
  if (!release.isDraft)
    throw new Error(
      'Published releases are immutable; create a new version instead.',
    );
} else {
  execFileSync(
    'gh',
    [
      'release',
      'create',
      tag,
      '--verify-tag',
      '--draft',
      ...(tag.includes('-') ? ['--prerelease'] : []),
      '--title',
      `Nutrition Counter ${tag.slice(1)}`,
      '--generate-notes',
    ],
    { stdio: 'inherit' },
  );
}
execFileSync(
  'gh',
  ['release', 'upload', tag, name, 'SHA256SUMS.txt', '--clobber'],
  { stdio: 'inherit' },
);
console.log(
  'Draft release ready. Verify retained data on a phone, then publish the draft.',
);
