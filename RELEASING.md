# Releases

Android APKs are distributed through GitHub Releases. EAS signs each build using the existing remote credentials for `org.fossnutrition.mealdiary`. Keep this identifier and signing key unchanged. Keep a private backup of the keystore; never commit it.

## Create a release

Write every release title, section heading and note in English, including installation and verification instructions. Translate existing notes in place; preserve release tags and attached assets.

1. Update `version` in `package.json`, the root entries in `package-lock.json`, and `expo.version` in `app.json` to the same semantic version, for example `0.2.0-beta.1`.
2. Commit and push. Checks runs lint, types, tests, formatting, release config checks and Android/iOS/web bundle exports.
3. Tag that commit and push the tag:

   ```sh
   git tag v0.2.0-beta.1
   git push origin v0.2.0-beta.1
   ```

4. Android release repeats checks, builds a standalone APK in EAS and attaches it plus `SHA256SUMS.txt` to a **draft** GitHub release. Beta tags are marked as prereleases. The workflow needs the repository secret `EXPO_TOKEN` with access to the existing EAS project. Signing credentials must already exist in EAS; CI never generates replacement credentials.
5. Install the APK over the prior version on a phone. Verify meals, photos, profile, water, settings and AI history remain, then test logging and backup restoration with a disposable dataset.
6. Publish the draft on GitHub. Installed beta versions see newer betas and stable releases; stable versions see only stable releases. Releases without APK attachments are ignored by the app.

The manual workflow action is for retrying a **tag**, not building from `main`. Published assets must not be replaced: bump the version for a new build. Release jobs are serialized; EAS remotely increments Android versionCode for release and preview builds. Do not change those profiles to a development client.

## Updates and data

Settings → App checks public GitHub Releases at launch and on request. Download update opens the APK link on Android; Android asks the user to approve installation. Silent installation and EAS OTA updates are not configured. Native dependency changes ship in a new APK.

Updating the installed app preserves its database and private files. Uninstalling or clearing data removes them. Expo Go has separate storage: export a JSON backup there, then restore it in the standalone app. Backups contain photos, diary, profile and history, exclude API keys and reset AI consent on restore. Restoration replaces existing app data after confirmation and leaves the current device’s API key in place. The format is versioned and validated before writing; native restoration stages photos before an exclusive SQLite transaction.

## Local build / recovery

```sh
npx eas-cli@24.10.0 build --platform android --profile release --non-interactive --wait --json > /tmp/meal-diary-build.json
node scripts/github-release.mjs /tmp/meal-diary-build.json v0.2.0-beta.1
```

The tag must already be pushed. Run on its matching clean checkout. These commands create a draft with the same manual device verification step.
