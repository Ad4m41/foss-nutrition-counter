import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const config = JSON.parse(readFileSync('app.json', 'utf8')).expo;
const tag = process.argv[2];
if (
  pkg.version !== config.version ||
  config.android.package !== 'org.fossnutrition.mealdiary'
)
  throw new Error(
    'Keep app/package versions aligned and preserve the Android package identifier.',
  );
if (
  tag &&
  (!/^v\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?$/.test(tag) ||
    tag !== `v${pkg.version}`)
)
  throw new Error(
    'Run releases from a version tag matching package.json and app.json.',
  );
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
if (
  eas.cli.appVersionSource !== 'remote' ||
  !eas.build.release.autoIncrement ||
  eas.build.release.android.buildType !== 'apk' ||
  eas.build.release.developmentClient
)
  throw new Error(
    'Release builds must generate standalone APKs with increasing remote build numbers.',
  );
console.log(`Release configuration OK: ${pkg.version}`);
