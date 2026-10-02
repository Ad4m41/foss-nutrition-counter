---
name: Meal Diary
description: A calm mobile food diary with editable nutrition and water tracking.
colors:
  light-bg: '#F5F6F3'
  light-surface: '#FFFFFF'
  light-tint: '#E6EFE8'
  light-text: '#202922'
  light-muted: '#58645C'
  light-primary: '#216C50'
  light-on-primary: '#FFFFFF'
  light-line: '#DFE4DE'
  light-danger: '#AB2634'
  light-danger-bg: '#FCEEF0'
  dark-bg: '#151C18'
  dark-surface: '#202A23'
  dark-tint: '#2A3C30'
  dark-text: '#F1F5EF'
  dark-muted: '#B8C6BA'
  dark-primary: '#A3D8B7'
  dark-on-primary: '#163A27'
  dark-line: '#3C4B3F'
  dark-danger: '#FFB0B9'
  dark-danger-bg: '#432832'
typography:
  headline:
    fontSize: '28px'
    fontWeight: 700
  navigation-title:
    fontSize: '26px'
    fontWeight: 700
  title:
    fontSize: '19px'
    fontWeight: 700
  row-title:
    fontSize: '18px'
    fontWeight: 600
  nutrient-main:
    fontSize: '21px'
    fontWeight: 600
    fontFeature: 'tabular-nums'
  nutrient-detail:
    fontSize: '16px'
    fontWeight: 600
    fontFeature: 'tabular-nums'
  body:
    fontSize: '16px'
    lineHeight: '24px'
  button:
    fontSize: '16px'
    fontWeight: 600
  field-label:
    fontSize: '14px'
  compact-label:
    fontSize: '12px'
rounded:
  field: '10px'
  control-notice: '12px'
  meal-thumbnail: '14px'
  card-photo: '16px'
spacing:
  compact: '6px'
  small: '8px'
  inline: '10px'
  field-gap: '12px'
  section: '16px'
  card: '20px'
  page: '24px'
  heading: '28px'
components:
  button-primary:
    backgroundColor: '{colors.light-primary}'
    textColor: '{colors.light-on-primary}'
    typography: '{typography.button}'
    rounded: '{rounded.control-notice}'
    padding: '14px 18px'
  button-secondary:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-primary}'
    typography: '{typography.button}'
    rounded: '{rounded.control-notice}'
    padding: '14px 18px'
  button-danger:
    backgroundColor: '{colors.light-danger-bg}'
    textColor: '{colors.light-danger}'
    typography: '{typography.button}'
    rounded: '{rounded.control-notice}'
    padding: '14px 18px'
  field:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.field}'
    padding: '12px'
  daily-summary:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.card-photo}'
    padding: '16px'
  date-chip:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.control-notice}'
  date-chip-selected:
    backgroundColor: '{colors.light-primary}'
    textColor: '{colors.light-on-primary}'
    rounded: '{rounded.control-notice}'
  notice:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.control-notice}'
    padding: '16px'
---

# Design System: Meal Diary

## Overview

**Creative North Star: "The Calm Daily Diary"**

A calm daily diary for Android and iOS phones. Pale warm neutral pages, white surfaces, graphite text and dark green actions give food and nutrition a clear, familiar frame. The Foodnoms reference informs the quiet diary rhythm; the graphite and green identity belongs to this app. System dark mode uses forest surfaces and pale green actions.

Native platform text and Expo Router navigation support a portrait, touch-first interface. Setup offers an own-key connection or manual mode, followed by an optional local profile. Nutrition remains visible in a compact grid; primary diary and editor actions stay below the scrolling content. Motion is limited to native navigation and the optional otter’s quiet breathing and blinking.

This document records implemented source and the approved visual direction. Browser review images and sidecar specimens are supplementary; no native device screenshots or native visual approval are available.

**Key Characteristics:**

- Warm neutral pages and paired green themes.
- Native platform typography and navigation.
- Compact, equally discoverable nutrient labels.
- Flat white cards and border-separated meal records.
- Pinned primary actions with scrolling supporting content.

## Colors

The palette combines warm, slightly green neutrals with one green action accent. Frontmatter is the normative source for exact values.

### Primary

- **Evergreen Action / Pale Leaf Action:** filled primary actions, selected dates, selected profile options, active tabs and progress fill.
- **Soft Leaf / Forest Tint:** secondary actions, informational notices and missing-photo placeholders.
- **On-primary:** white in light mode and deep green in dark mode, paired with each filled action.

### Neutral

- **Warm Page / Forest Page:** full-screen backgrounds and pinned action areas.
- **White Surface / Forest Surface:** fields, daily nutrition card, profile estimate and tab bar.
- **Graphite Ink / Pale Ink:** headings, food names and nutrition values.
- **Muted Graphite / Muted Leaf:** labels, helper copy and inactive navigation.
- **Soft Line / Forest Line:** input borders, nutrient dividers, meal dividers and progress tracks.
- **Danger / Danger Surface:** the red semantic pair reserved for error notices and destructive actions.

**The Semantic Pair Rule.** Switch every role with the system color scheme; retain its matching foreground and background pair.

Frontmatter component references show light mode. Dark mode substitutes the corresponding `dark-` roles through `useTheme()`.

## Typography

**Body Font:** native platform default. Headings, labels and numerical values use the same default family; no custom font is loaded.

### Hierarchy

- **Headline:** bold onboarding and settings section headings.
- **Navigation title:** bold native tab-screen titles.
- **Title:** bold section labels; nutrition headings use the same size at weight 600.
- **Row title:** semibold meal names, selected day and activity description.
- **Nutrient main:** semibold calories and three main macronutrient values.
- **Nutrient detail:** semibold additional nutrient values with equal label treatment.
- **Body:** readable supporting paragraphs and meal metadata.
- **Button:** centered semibold action labels that can shrink and wrap.
- **Field label:** muted labels above fields.
- **Compact label:** nutrient labels, weekday labels and tab text; tabs use weight 600.

Profile estimates use a semibold total (28 logical units); water uses a semibold total (24) with smaller regular goal text (15). Notices use text (15) with line height (22); date metadata uses (13). These are React Native logical units, represented as px in the portable frontmatter. Preserve native text scaling.

**The Stable Numbers Rule.** Nutrition and water totals use tabular numbers so changes remain easy to compare.

## Layout

Phone content scrolls in one column with page gutters (24 logical units), centered at a maximum width (560). The portrait diary begins with the current day, previous/next controls and a five-day strip. Its compact nutrition card follows; meal records and water controls scroll below. Add meal remains in a footer outside the scroll view. The meal editor and profile form use the same pinned-action structure.

The footer shares the content width and gutters, with top padding (8) and bottom padding equal to the larger of (12) or the safe-area inset. Scroll content bottom padding is the larger of (32) or the inset plus (20). iOS uses keyboard avoidance; content remains scrollable during entry.

Nutrition uses a wrapping two-column grid with column gap (16) and flex basis (45%). Profile height and weight wrap with flex basis (44%), while age occupies the full row. Ingredient fields wrap with minimum width (120), flex basis (43%) and column gap (12). Button groups wrap; no authored responsive breakpoints exist.

## Elevation & Depth

No authored shadows or elevations. Surface contrast groups nutrition and profile estimates; leaf tint groups secondary controls and notices. One-unit borders organize fields and records. Native headers suppress their shadow. Native navigation transitions and activity indicators provide functional motion. The water mascot adds quiet Rive breathing and blinking in supported native builds; reduced motion uses the static asset. No shared custom duration or easing tokens are implemented.

## Shapes

Soft rectangular corners use the frontmatter field, control, thumbnail and card roles. Meal rows remain open and border-separated. The date strip uses the control radius and a minimum height (60); meal thumbnails are square (76). Thin progress tracks are (4) high and clip their fill, with diary radius (4) and water radius (2). Avoid turning each nutrient into a separate rounded tile.

## Components

### Buttons

Direct, quiet actions. Primary uses the green/on-primary pair; secondary uses tint/green; destructive uses danger surface/danger. Buttons have minimum height (52), padding (14 vertical, 18 horizontal) and icon gap (10). Pressed opacity is (0.8); disabled or loading opacity is (0.55). A native activity indicator replaces the icon during loading. Icon-only controls have a minimum (48 by 48) target, pressed opacity (0.6) and disabled opacity (0.4).

There is no authored native hover or focus decoration. Browser specimens use browser focus outlines and simple opacity states as supplementary interaction affordances.

### Chips

Five neighboring date controls form one strip. Unselected dates use surface, graphite day numbers and muted weekday labels; selected dates use primary/on-primary. Pressed opacity is (0.7). Selected state is also exposed to accessibility services. Profile sex, objective and language options reuse primary/secondary buttons rather than introducing a separate chip system.

### Cards / Containers

Daily nutrition sits on a flat surface card with compact padding; profile estimates use the same surface/radius with padding (20). Informational notices use leaf tint and notice padding; errors switch to danger roles and expose an alert. These containers have no shadow.

### Inputs / Fields

Visible labels sit above surface-filled fields with a one-unit line border, minimum height (50) and field padding. Selection uses primary. Password-like key fields are masked with a visible show/hide action. Native focus behavior remains; invalid form feedback appears in a separate notice rather than changing the field border.

### Navigation

Expo Router tabs expose Diary and Settings with Ionicons outline symbols. Active items use primary and inactive items use muted. The tab surface has a line-colored top border, height (64) plus bottom safe-area inset, top padding (6), and bottom padding (6) plus that inset. Meal and profile editors push onto the native stack. Polish and English labels are supported.

Key setup is a full-screen, single-column form with key verification, show/hide, key acquisition and a visible manual-mode skip. Optional profile setup follows, with age, height, weight, formula sex, a five-stop activity slider and weight objective. Save remains pinned; skip appears in the initial form. Background key validation keeps navigation and meal drafts mounted.

### Nutrition and Meal Records

The same compact nutrient grid serves diary and editor summaries. Every nutrient has a visible label; the first four values are larger while additional nutrients retain their own labeled cells. Unknown extra values display localized feedback and an incomplete-total note. There is no hidden drawer for daily nutrient totals. Ingredient editing exposes extra nutrient fields through a visible expand action. Grams edits recalculate nutrition immediately without animating the values.

Meal records use a photo or tinted outline-icon placeholder, a flexible name/calorie/source column and a trailing chevron. They use row padding (16 vertical), gap (14), a bottom border and pressed opacity (0.7).

### Water

Water follows meal records in the scrolling diary. Its tabular total, goal text and thin progress track use the same green identity. Secondary actions add (250 ml) or (500 ml); an undo action appears for the latest drink recorded during the current mounted session and selected day. Storage failure uses the shared error notice. An otter sits to the right of the water summary in a fixed frame (100 by 106). Its expression stays happy across all entries. In supported native builds, a bundled Rive asset breathes and blinks; body width varies gently with logged calorie progress and hydration changes the water detail. The caption explains that shape reflects entries rather than body weight. It remains supplementary to the numeric summary, is hidden from accessibility services and accepts no touches.

Web, Expo Go, reduced motion, background or unfocused screens, loading and runtime errors use the bundled transparent static otter. The native asset runs at (30 frames per second), with no asset or runtime network request. The authored Rive asset and bindings have CLI evidence; native device rendering remains unverified.

## Do's and Don'ts

### Do:

- Do use matching semantic foreground/background roles in both color schemes.
- Do retain visible nutrient labels and unknown-value feedback.
- Do keep primary diary and editor actions reachable below the scrolling content.
- Do preserve native text scaling, wrapping and at least 48-unit touch targets.
- Do use tabular numbers for nutrition and water totals.
- Do keep meal records flat and use surfaces to group nutrition.

### Don't:

- Don't restore the former blue identity or introduce a second decorative accent.
- Don't add large decorative transitions; keep native navigation and the restrained mascot motion.
- Don't use color alone to communicate errors or selected controls.
- Don't treat browser specimens as evidence of native device approval.
- Don't describe mascot shape as body weight, or change its happy expression to judge entries.
