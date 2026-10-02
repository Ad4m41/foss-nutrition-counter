# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

Expo SDK 57, React Native, TypeScript, Expo Router. Approved in the implementation plan.

## Users

People who want to log meals on an Android phone or iPhone, using a photo or a manual entry.

## Product Purpose

A free, open source nutrition diary tracking calories, protein, carbohydrates, fats, saturated fat, sugars, fiber and salt. Photograph a meal, review estimated portions and nutrition, and save it to a daily diary.

## Capabilities and Constraints

Own Gemini API key, local SQLite storage, retained local photos, Polish and English, GPL-3.0. No account, sync, ads, analytics, barcode scanning, or product database in MVP. AI needs internet; manual logging works offline. The user confirms every AI estimate before saving.

Local adult profile setup collects age, height, weight, sex, a five-level daily activity selection and a weight goal. It estimates an editable calorie target. Daily water totals support quick additions and undo; water goals are editable. Personal profile and hydration records stay on the device.

First launch opens Gemini key setup with a persistent manual-mode skip. Saved keys are checked at startup and on return from the background. Rejected keys reopen setup; rate limits do not block entry. Network failures retain access with a saved key.

## Visual Direction

The user approved a bright, calm diary inspired by Foodnoms, with an original graphite and green palette, native controls and accessible nutrition summaries. The otter uses an original bundled Rive animation with breathing and blinking. Its body width reflects logged food; a droplet reflects logged water. This is a playful diary reaction, not an estimate of body weight. Expo Go, web and reduced motion use a bundled still; native animation requires a development or preview build.

## Product Principles

- Keep meal entry short and corrections visible.
- Preserve the draft when analysis fails.
- Keep keys out of source, logs, and diary storage.
- Explain when a photo leaves the phone.

## Open Decisions

Final public name and store distribution are undecided. Use “Meal Diary” / “Dziennik posiłków” as descriptive working titles.
