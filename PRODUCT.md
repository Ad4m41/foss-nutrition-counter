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

## Product Principles

- Keep meal entry short and corrections visible.
- Preserve the draft when analysis fails.
- Keep keys out of source, logs, and diary storage.
- Explain when a photo leaves the phone.

## Open Decisions

Final public name and store distribution are undecided. Use “Meal Diary” / “Dziennik posiłków” as descriptive working titles.
