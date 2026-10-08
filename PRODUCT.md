# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Expo SDK 57, React Native, TypeScript, Expo Router. Approved in the implementation plan.

## Users

People who want to log meals on an Android phone or iPhone, using an AI analysis of a photo and/or description, with manual entry as a secondary option.

## Product Purpose

A free, open source nutrition diary tracking calories, protein, carbohydrates, fats, saturated fat, sugars, fiber and salt. Add up to four photos of a meal, alternate angles or labels, review estimated portions and nutrition, and save it to a daily diary.

## Capabilities and Constraints

Own Gemini API key, local SQLite storage, retained local photos, Polish and English, AGPL-3.0-only. No account, sync, ads, analytics, barcode scanning, or product database in MVP. AI needs internet; manual logging works offline. Explicit eaten quantities and sizes in the description take precedence over a partial or sample photo. AI returns nutrition for one base portion and a separate quantity per ingredient; the app scales grams and nutrients exactly once. The user confirms every AI estimate before saving. Adding a meal defaults to AI input; the editor appears after analysis. When uncertainty matters, AI may ask up to three recommended or optional yes/no, slider or text questions. All can be skipped using the provisional estimate; answering triggers a single refinement counted in the local request limit. Untouched controls stay unanswered.

Local adult profile setup collects age, height, weight, sex, a five-level daily activity selection and a weight goal. It estimates and saves editable calorie, protein, carbohydrate and fat targets together. Daily water totals support quick additions and undo; water goals are editable. Personal profile and hydration records stay on the device.

First launch opens Gemini key setup with a persistent manual-mode skip. Saved keys are checked at startup and on return from the background. Rejected keys reopen setup; rate limits do not block entry. Network failures retain access with a saved key.

Product checks explain a supplied name, ingredients or label photo without creating a diary entry. Results include nutrition for an explicit serving or per 100 g/ml, distinguished as supplied label facts or an AI estimate. Missing nutrients stay unknown; insufficient food context shows a request for a clearer label or description. Local Gemini history records reported token usage and an optional shared daily analysis limit. Failed, cancelled and interrupted attempts count toward the device limit; key checks are excluded. No account-wide AI Studio synchronization.

Camera and gallery results are recovered after Android activity recreation before any automatic camera launch. Processed photo drafts live in private documents while analysis runs. Meal persistence awaits a separate permanent photo copy before writing its database row; failed copies or database writes preserve the previous meal and its photo. Editor cleanup owns acquired drafts only and cannot delete retained meal photos. All meal photos are retained and included in later AI corrections and backups; existing single-photo meals remain supported. Multiple gallery selections are processed sequentially to bound native memory use. AI receives all selected images in one request and is instructed not to count repeated views as separate portions.

## Visual Direction

The user approved a bright, calm diary inspired by Foodnoms, with warm cream surfaces, evergreen ink, apricot add actions and bundled Manrope typography. Meals lead the diary; a compact four-column macro strip spans the screen and joins custom navigation, with rounded top corners. Goal excess rescales the rail into nutrient and excess segments. Tabs animate presses and visibly mark the current destination. Three profile steps include a snapping cylinder age wheel, animated sex selection and five activity levels. Reanimated powers wheel transforms and progress, respecting reduced motion. Calculated macro targets remain user-editable. Language follows the device by default; a searchable flag selector persists manual changes immediately.

## Product Principles

- Keep meal entry short and corrections visible.
- Preserve the draft when analysis fails.
- Keep keys out of source, logs, and diary storage.
- Explain when a photo leaves the phone.

## Open Decisions

The public app name is “Nutrition Counter”. Store distribution is undecided.

## Distribution and local data

GitHub CI checks types, lint, tests, formatting and platform bundles. Version tags build signed standalone Android APKs through EAS and prepare draft releases with checksums. The app checks published releases on launch and lets users download updates. Beta and stable channels follow semantic versions. Local JSON backup includes photos and excludes API keys; confirmed restores replace diary data transactionally on native devices.
