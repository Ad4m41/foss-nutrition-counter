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

Logging, product checks, key setup, the profile slider and water controls work in Expo Go. Expo Go does not apply this project's app icon or custom permission descriptions. For a standalone app, or an SDK mismatch you cannot resolve in Expo Go, use a development build:

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

After key setup, complete three steps: body details with a scrolling age wheel and sex selector, one of five daily activity levels, then maintain, lose or gain weight. You can skip profile setup or edit it later in Settings. The calorie estimate uses [Mifflin–St Jeor](https://pubmed.ncbi.nlm.nih.gov/2305711/?format=pubmed), multiplied by an estimated PAL. The five app bands are 1.4, 1.6, 1.8, 2.0 and 2.2; they are coarse defaults within the [NIDDK activity range](https://www.niddk.nih.gov/bwp), not measured activity or a clinical model. Lose/gain applies an editable starting adjustment of −10%/+10%. The estimate supports adults aged 18–100, excluding pregnancy and breastfeeding. Saving a profile sets calories and all three macro targets together. Protein uses an editable app default of 1.2–2.0 g/kg depending on activity and goal (capped at 35% of energy); the exercise range is informed by the [ISSN position stand](https://doi.org/10.1186/s12970-017-0177-8). Fat supplies 30% of energy, and carbohydrates fill the remainder; gram targets are rounded. These are starting estimates, adjustable in Settings. Existing profiles without macro targets receive calculated targets once on loading.

Language follows the phone by default, including changes reported by Expo localization. The searchable flag selector switches and saves the language immediately. Selecting a language enables manual mode; the phone-language switch restores automatic mode.

The diary keeps kcal, protein, carbohydrates and fat in a compact strip joined to the bottom navigation, with full-width surfaces and rounded top corners. Above a goal, rails scale to the consumed amount: 100 g against an 80 g goal shows 80% in the nutrient color and 20% as excess, alongside the actual values. Tap this summary for all eight nutrients. Use the central add button to start AI meal entry on the selected day; manual entry is a secondary option. Set optional protein, carbohydrate and fat targets in Settings; blank targets stay unset.

The diary records water per selected day. Use the +250 ml and −250 ml controls beneath the water card. Subtraction stops at zero. Set your water goal in Settings; 2,000 ml is an editable default, not an individualized recommendation. Reset removes profile, water, meals, photos, AI history and the key.

## AI meal entry and clarification

**Add meal** starts with a photo and/or meal description, with camera and gallery controls in two equal columns. Tap **Estimate**. The portion editor appears after the result; manual entry remains available through **Enter manually**. A description alone can be analyzed when there is no photo.

When missing details materially affect the estimate, AI may return up to three **recommended** or **optional** questions alongside a provisional estimate. Questions use yes/no, a numeric slider with units, or text. Confident results open review directly. Every question can be skipped, including recommended ones. An untouched slider stays unanswered until moved or explicitly confirmed; “no” and zero remain actual answers. **Skip · use the estimate** opens the first result without another API call and retains an uncertainty note. **Use answers and estimate** sends the original photo/description plus the supplied answers for one refinement, counted in the AI request limit/history. Skipped answers remain unknown. Refinement never opens another round of questions. Failures preserve the answers and allow retry or using the initial estimate.

## Check a product and track Gemini usage

Open the central **+** button and choose **Check product**. Enter a product name or ingredients, or select/take a photo of its ingredients and nutrition label. Gemini explains nutritional strengths, concerns, supplied allergen information, missing data and practical meal context. Name-only input gives general category information, not verified brand-specific facts. The analysis does not add a meal; check label facts, especially allergens. Product photos are temporary and removed when replaced or leaving the screen.

In **Settings → AI usage**, set an optional positive whole-number daily analysis limit and save settings; blank disables the local limit. Meal and product analyses share the same counter. Every reserved attempt counts, including clarification refinements, errors, cancellations and requests interrupted by closing the app. The limit resets at local midnight. Reservations are persisted before sending and serialized to prevent simultaneous actions bypassing the limit. A storage failure prevents dispatch; manual logging stays available. Key authentication checks do not count toward this analysis limit.

History records request time, model, type, status and Google's reported input, output, thinking, cached-input and total token counts. Missing metadata stays unknown, including network failures; displayed sums include reported values only. Pending entries after a restart have an unknown result and still count. Total tokens come directly from `usageMetadata`, rather than adding fields with overlapping meanings. This is local app history starting with this feature, not a synchronized AI Studio account report, billing estimate, or enforcement of Google's project quota. Usage via other devices/apps is not included. Reset deletes this history with the rest of the local data. No keys, prompts or photos are stored in usage entries.

## Configure Gemini

1. Create a project and API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Paste the key on the opening screen and tap **Check key and continue**. You can change it and the model later in **Settings**.
3. Add a photo, optionally describe hidden ingredients or a known portion, and tap **Estimate**.
4. Review ingredient names, grams and nutrition values. Save only after checking them.

The app checks saved keys at launch and after returning from the background, using Google's model-list endpoint without generating content. Rate limits (HTTP 429) allow entry. Rejected keys return to setup; offline or server errors preserve access with a saved key. A new key must pass the check or receive HTTP 429 before saving. **Continue without a key** clears the key and remembers manual mode. Adding a key in Settings re-enables checking. Web previews retain keys only in memory, so refreshing requires re-entry unless manual mode was selected.

The default is `gemini-3.5-flash-lite`. Model access and free quotas vary by project; check [active limits](https://ai.google.dev/gemini-api/docs/rate-limits) and [pricing](https://ai.google.dev/gemini-api/docs/pricing). The app makes one request per analysis action and never changes models automatically. Using a paid project can incur Google charges.

Track kcal, protein, carbohydrates, fat, saturated fat, sugars, fiber and salt. All non-energy values use grams; salt means salt-equivalent, not sodium. Blank extra fields mean unknown, including in older entries. A daily total remains unknown when any ingredient lacks that value; enter a confirmed zero as `0`. Sugars are included in carbohydrates and saturated fat in fat, not added again.

Nutrition values describe each ingredient’s entered portion, not 100 g. Changing grams scales that ingredient’s values. You can override each value, add or remove ingredients, and change the meal date. The initial 2,000 kcal goal is an editable starting value, not a personalized recommendation.

## Data and privacy

- Mobile: meals and preferences in SQLite; compressed photos in the app’s documents directory; API key in Expo SecureStore. No account, backend, analytics or ads.
- Analysis sends the selected JPEG and optional description directly to Google after consent. The whole diary and unrelated photos are not sent. Free-tier terms may allow Google to use submitted data for product improvement. Read [Google’s API terms](https://ai.google.dev/gemini-api/terms).
- AI results are estimates. Photos cannot establish exact weight or hidden ingredients. Manual logging remains available without a key or internet.
- Delete a meal to remove its stored photo. **Delete all local data** removes meals, retained photos, preferences and the key. Settings → App supports versioned JSON backup/export and restoration, including photos and excluding API keys. Restoring replaces local diary data after confirmation.
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

Automated tests mock Gemini, native photo picking and secure storage. Service regressions also exercise React Native's AbortController implementation, which does not provide `signal.throwIfAborted()`; analysis checks `signal.aborted` directly. Runtime analysis errors are distinguished from local storage errors. They do not establish model accuracy or native permission behavior. Before a release, test on both platforms: camera and gallery, denied permissions, restart persistence, offline manual entry, dark mode, large text, unsaved changes, and deleting photos/data. Test Gemini with your own project key and a meal whose weight you know.

## Dependency audit

`npm audit` currently reports upstream Expo/router/tooling advisories. Compatible patch updates have been applied. The remaining automatic suggestions downgrade Expo to SDK 44 or Router to an incompatible version, so they have not been applied. Review these advisories before distribution; bundle checks do not establish their resolution.

## License

Application code: **AGPL-3.0-only**, see [LICENSE](LICENSE). The Expo scaffold’s original MIT notice is retained in `assets/EXPO-TEMPLATE-LICENSE.txt`. Dependency licenses remain their respective authors’ licenses. This project is independent of Fitatu.

Settings has Account and App settings sub-tabs. Account contains the local profile and nutrition targets; App settings contains language, AI configuration, usage and local data controls. Language flags are bundled image assets. Short haptics acknowledge buttons and selection changes, limited to one pulse per 80 ms; unavailable haptics never block actions.

## Releases and updates

See [RELEASING.md](RELEASING.md) for version tags, CI, signed APK builds and publishing. GitHub Actions checks every push/PR; a version tag triggers EAS and prepares a draft release with an APK and SHA-256 checksum. Publish after device testing. The app checks public releases at startup, shows an update notice in the diary and offers a download action in Settings → App. Stable installations ignore beta releases. Install each APK over the existing app to retain data.

Backups export meals, embedded photos, profile, goals, water and AI usage (32 MB maximum). They exclude API keys; restoration preserves the current device key and requires AI consent again. Export from Expo Go and restore into the standalone app to migrate data.

The macro dock softly blurs scrolling content behind it at intensity 18. Android 12+ uses the efficient blur implementation; older Android versions use a translucent fallback. Text and progress rails remain sharp.
