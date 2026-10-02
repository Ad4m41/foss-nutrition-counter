# Meal Diary / Dziennik posiłków

Free and open-source nutrition tracker for Android and iOS. Log meals from photos with Gemini AI or enter them manually. Vibe coded with Codex. Track calories, protein, carbohydrates, fats, saturated fat, sugars, fiber and salt.

## Run locally

Requires Node.js 22.13+ and npm. This project uses Expo SDK 57.

```sh
npm ci
npm start
```

## Try on your phone with Expo Go

1. Install **Expo Go** from Google Play or the App Store, with support for SDK 57.
2. Connect your phone and computer to the same Wi-Fi network.
3. Run `npm ci`, then `npx expo start --go` (or `npm run start:go`).
4. Scan the terminal QR code in Expo Go on Android or with the Camera app on iPhone.
5. On a physical iPhone, run `npx expo login` and sign in to Expo Go with the same Expo account.
6. Paste your Gemini key on the opening screen, or choose **Continue without a key** for manual logging.

If LAN access fails, run `npx expo start --go --tunnel`. Keep the computer and development server running. See [Expo's device instructions](https://docs.expo.dev/get-started/start-developing/).

Logging, key setup, the profile slider and water controls work in Expo Go; the otter is static there. Animated Rive requires native modules available in a development or standalone build. Expo Go does not apply this project's app icon or custom permission descriptions. For a standalone app, or an SDK mismatch you cannot resolve in Expo Go, use a development build:

```sh
npx expo run:android
# macOS with Xcode:
npx expo run:ios
```

Or build with your own Expo account:

```sh
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
npx expo start --dev-client
```

EAS requires signing credentials; physical iOS distribution requires Apple provisioning. No binaries have been published. `npm run web` starts a browser preview; it does not replace Android/iOS testing.

## Install an Android APK

The configured EAS project ID is `7f3bafe9-d857-425b-af29-63b66138f914`. Sign in to an Expo account with access to that project, verify the link, then build:

```sh
npx eas-cli@latest login
npx eas-cli@latest init --id 7f3bafe9-d857-425b-af29-63b66138f914
npx eas-cli@latest build --platform android --profile preview
```

Open the completed build link on your Android phone, download the APK and allow installation from that source. This preview includes the app bundle and works without a running development server. Photo analysis still needs internet access. Forks should link their own EAS project. See [Expo's APK instructions](https://docs.expo.dev/build-reference/apk/).

## Profile, goals and water

After key setup, complete three steps: body details with a scrolling age wheel and sex selector, one of five daily activity levels, then maintain, lose or gain weight. You can skip profile setup or edit it later in Settings. The calorie estimate uses [Mifflin–St Jeor](https://pubmed.ncbi.nlm.nih.gov/2305711/?format=pubmed), multiplied by an estimated PAL. The five app bands are 1.4, 1.6, 1.8, 2.0 and 2.2; they are coarse defaults within the [NIDDK activity range](https://www.niddk.nih.gov/bwp), not measured activity or a clinical model. Lose/gain applies an editable starting adjustment of −10%/+10%. The estimate supports adults aged 18–100, excluding pregnancy and breastfeeding.

The diary keeps kcal, protein, carbohydrates and fat above the bottom navigation. Tap this summary for all eight nutrients. Use the central add button for a photo or manual entry on the selected day. Set optional protein, carbohydrate and fat targets in Settings; blank targets stay unset.

The diary records water per selected day. Add 250 or 500 ml, or undo the last addition in the current session. Set your water goal in Settings; 2,000 ml is an editable default, not an individualized recommendation. Reset removes profile, water, meals, photos and the key. The diary includes an otter: native Rive animates breathing, blinking, body width based on logged food, and a droplet based on logged water. Its appearance does not estimate your body weight. Expo Go, web, reduced motion and runtime errors use a bundled still. Rive needs a new development or preview build; an OTA update cannot add its native modules. See [the asset source](assets/otter/README.md).

## Configure Gemini

1. Create a project and API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Paste the key on the opening screen and tap **Check key and continue**. You can change it and the model later in **Settings**.
3. Add a photo, optionally describe hidden ingredients or a known portion, and tap **Estimate nutrition**.
4. Review ingredient names, grams and nutrition values. Save only after checking them.

The app checks saved keys at launch and after returning from the background, using Google's model-list endpoint without generating content. Rate limits (HTTP 429) allow entry. Rejected keys return to setup; offline or server errors preserve access with a saved key. A new key must pass the check or receive HTTP 429 before saving. **Continue without a key** clears the key and remembers manual mode. Adding a key in Settings re-enables checking. Web previews retain keys only in memory, so refreshing requires re-entry unless manual mode was selected.

The default is `gemini-3.5-flash-lite`. Model access and free quotas vary by project; check [active limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [pricing](https://ai.google.dev/gemini-api/docs/pricing). The app makes one request per analysis action and never changes models automatically. Using a paid project can incur Google charges.

Track kcal, protein, carbohydrates, fat, saturated fat, sugars, fiber and salt. All non-energy values use grams; salt means salt-equivalent, not sodium. Blank extra fields mean unknown, including in older entries. A daily total remains unknown when any ingredient lacks that value; enter a confirmed zero as `0`. Sugars are included in carbohydrates and saturated fat in fat, not added again.

Nutrition values describe each ingredient’s entered portion, not 100 g. Changing grams scales that ingredient’s values. You can override each value, add or remove ingredients, and change the meal date. The initial 2,000 kcal goal is an editable starting value, not a personalized recommendation.

## Data and privacy

- Mobile: meals and preferences in SQLite; compressed photos in the app’s documents directory; API key in Expo SecureStore. No account, backend, analytics or ads.
- Analysis sends the selected JPEG and optional description directly to Google after consent. The whole diary and unrelated photos are not sent. Free-tier terms may allow Google to use submitted data for product improvement. Read [Google’s API terms](https://ai.google.dev/gemini-api/terms).
- AI results are estimates. Photos cannot establish exact weight or hidden ingredients. Manual logging remains available without a key or internet.
- Delete a meal to remove its stored photo. **Delete all local data** removes meals, retained photos, preferences and the key. There is no backup/export feature in this MVP; OS-level device backups follow platform behavior.
- Browser preview: localStorage replaces SQLite and the key stays in memory until refresh. Browser storage may fill sooner than mobile storage. Do not use the preview as your only diary.

## Development

```sh
npm test                          # unit and component tests; no real API requests
npm run typecheck
npm run lint
npm run format:check
npx expo-doctor
npx expo export --platform all     # verify native and web bundles
```

Routes live in `src/app/`; shared controls in `src/components/`; nutrition and translations in `src/core/`; Gemini, photos and persistence in `src/services/`; application state in `src/state/`. Tests live in `tests/` and icons in `assets/`.

Use TypeScript, two-space indentation and Prettier. Add tests for portion arithmetic, response validation and changes to save/error flows. Keep API keys, photos, device databases and signing credentials out of Git. For PRs, describe the change, list checks run, and attach device screenshots for visible UI changes. No repository commit convention existed at initialization; use concise imperative commit messages.

## Verification limits

Automated tests mock Gemini, native photo picking and secure storage. They do not establish model accuracy or native permission behavior. Before a release, test on both platforms: camera and gallery, denied permissions, restart persistence, offline manual entry, dark mode, large text, unsaved changes, and deleting photos/data. Test Gemini with your own project key and a meal whose weight you know.

## Dependency audit

`npm audit` currently reports upstream Expo/router/tooling advisories. Compatible patch updates have been applied. The remaining automatic suggestions downgrade Expo to SDK 44 or Router to an incompatible version, so they have not been applied. Review these advisories before distribution; bundle checks do not establish their resolution.

## License

Application code: **GPL-3.0-only**, see [LICENSE](LICENSE). The Expo scaffold’s original MIT notice is retained in `assets/EXPO-TEMPLATE-LICENSE.txt`. Dependency licenses remain their respective authors’ licenses. This project is independent of Fitatu.
