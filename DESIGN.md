---
name: Meal Diary
description: A phone-first food diary with editable nutrition estimates.
colors:
  light-bg: '#F4F8FC'
  light-surface: '#FFFFFF'
  light-tint: '#E1EEFA'
  light-text: '#172F47'
  light-muted: '#4A647B'
  light-primary: '#175CB0'
  light-on-primary: '#FFFFFF'
  light-line: '#CBDAE8'
  light-danger: '#AB2634'
  light-danger-bg: '#FCEEF0'
  dark-bg: '#101E2C'
  dark-surface: '#182C3F'
  dark-tint: '#213F59'
  dark-text: '#EFF6FF'
  dark-muted: '#B0C6D9'
  dark-primary: '#9AC6FF'
  dark-on-primary: '#102E54'
  dark-line: '#3B5369'
  dark-danger: '#FFB0B9'
  dark-danger-bg: '#432832'
typography:
  nutrient-total:
    fontSize: '32px'
    fontWeight: 700
    fontFeature: 'tabular-nums'
  headline:
    fontSize: '26px'
    fontWeight: 700
  title:
    fontSize: '19px'
    fontWeight: 700
  row-title:
    fontSize: '18px'
    fontWeight: 600
  body:
    fontSize: '16px'
    lineHeight: '24px'
  button:
    fontSize: '16px'
    fontWeight: 600
  field-label:
    fontSize: '14px'
rounded:
  field: '10px'
  notice-thumbnail: '12px'
  button: '14px'
  summary-photo: '16px'
spacing:
  compact: '6px'
  inline: '10px'
  field-gap: '12px'
  section: '16px'
  page: '20px'
  separation: '24px'
components:
  button-primary:
    backgroundColor: '{colors.light-primary}'
    textColor: '{colors.light-on-primary}'
    typography: '{typography.button}'
    rounded: '{rounded.button}'
    padding: '14px 18px'
  button-secondary:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-primary}'
    rounded: '{rounded.button}'
    padding: '14px 18px'
  button-danger:
    backgroundColor: '{colors.light-danger-bg}'
    textColor: '{colors.light-danger}'
    rounded: '{rounded.button}'
    padding: '14px 18px'
  field:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.field}'
    padding: '12px'
  daily-summary:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.summary-photo}'
    padding: '22px'
  notice:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.notice-thumbnail}'
    padding: '16px'
---

# Design System: Meal Diary

## Overview

**Creative North Star: "The Mobile Meal Diary"**

A quiet, practical diary for Android and iOS phones. Blue actions and pale surfaces frame editable food records; dark mode substitutes navy surfaces and light blue actions. Native navigation and platform text keep the interface familiar.

This record describes the implemented source, not device visual approval. Browser specimens in the sidecar are supplementary translations of native components. No native device screenshots were available.

**Key Characteristics:**

- Semantic light and dark palettes.
- Native platform typography and navigation.
- Flat tonal summaries and border-separated records.
- Large touch controls and immediately recalculated nutrition.

## Colors

The primary palette is blue; danger feedback uses a separate red semantic pair.

### Primary

- **Action Blue / Light Blue:** primary actions, selected navigation, progress fill, and outline icons.
- **Pale Blue / Navy Tint:** secondary actions, daily summary, notices, and thumbnail placeholders.
- **On-primary:** paired foreground for filled actions; changes with the theme.

### Neutral

- **Page:** pale blue-white in light mode and deep navy in dark mode.
- **Surface:** input fields and tab navigation.
- **Ink:** headings and primary information.
- **Muted Ink:** field labels, supporting text, and inactive navigation.
- **Line:** input borders, row dividers, and progress tracks.
- **Danger / Danger Surface:** destructive actions and error notices.

**The Semantic Pair Rule.** Switch every role with the system color scheme; retain its matching foreground and background pair.

Frontmatter component references describe light mode. Dark mode uses the corresponding `dark-` roles, as `useTheme()` does in the implementation.

## Typography

**Body Font:** native platform default; no custom family is assigned. Functional headings use that same default. There is no distinct display or brand font.

### Hierarchy

- **Nutrient total:** bold total with tabular numbers; smaller regular units.
- **Headline:** large section heading.
- **Title:** editor sections.
- **Row title:** meal names and selected day.
- **Body:** reading and supporting copy.
- **Button:** centered action text, allowed to shrink and wrap.
- **Field label:** muted label above its input.

The implementation also uses supporting nutrition values (17px, weight 600), notice text (15px, line height 22px), and date metadata (13px). Text sizes are React Native logical units; the frontmatter uses portable px notation. Keep native text scaling enabled.

**The Stable Numbers Rule.** Nutrition totals use tabular numbers so portion changes remain easy to compare.

## Layout

Portrait phone content scrolls in one column with page padding and a centered maximum width (640 logical units). Safe-area bottom padding is the larger of 32 or the bottom inset plus 20. iOS uses keyboard avoidance; fields remain reachable by scrolling.

Ingredient nutrient fields wrap, using a minimum width of 120 and a 43% flex basis. Macro labels and photo actions wrap naturally. There are no authored responsive breakpoints. The diary's day selector, summary, meal rows, and full-width add action share the same content column.

## Elevation & Depth

No authored shadows or elevations. Tint separates summaries from the page; one-unit borders separate fields and records. Navigation headers suppress their shadow. Native stack and tab transitions supply navigation motion; there are no authored animation durations or easing tokens.

## Shapes

Rounded fields, notices, thumbnails, buttons, summaries, and photos use their frontmatter roles. Meal rows remain flat and open, separated by a bottom border. The progress track is 8 units high with a 4-unit radius and clipped fill.

## Components

### Buttons

Filled, centered actions with optional outline icons. Minimum height is 52; icon-only controls have a minimum 48-by-48 touch area. Primary, secondary, and danger variants use semantic color pairs. Press reduces opacity to 0.8; disabled or loading reduces it to 0.55. Loading replaces the icon with a native activity indicator. Icon-only controls use pressed opacity 0.6 and disabled opacity 0.4.

### Cards / Containers

The daily summary is a tinted container, not an elevated card. It combines calories, wrapped macro values, goal progress, and supporting text. Notices use the notice radius and swap to danger roles for errors.

### Inputs / Fields

Visible muted labels sit above surface-filled inputs with a one-unit line border and minimum height 50. Selection uses the primary color. Native focus behavior remains; no custom focus or hover decoration is authored. Errors appear in a separate notice rather than changing field borders.

### Navigation

Native Expo Router tabs expose Diary and Settings with Ionicons outline symbols. Active items use primary; inactive items use muted. The tab surface has a line-colored top border, height 64 plus the bottom safe-area inset, top padding 6, and bottom padding 6 plus that inset. Editors push onto the native stack. Labels localize to Polish and English.

### Meal Rows and Nutrition

Meal rows use a 64-unit square photo or tinted outline-icon placeholder, a flexible title and calorie/source column, and a trailing chevron. Rows have vertical padding 16 and pressed opacity 0.7. Nutrition summaries show calories, protein, carbohydrates, fats, saturated fat, sugars, fiber and salt. Missing extra values display a localized unknown label; a note explains incomplete totals. The editor recalculates nutrition immediately when grams change; it does not animate the values. In-progress analysis exposes a cancel action using the existing button treatment.

## Do's and Don'ts

### Do:

- Do use semantic foreground/background pairs in both color schemes.
- Do preserve native text scaling, wrapping, and at least 48-unit touch targets.
- Do use tabular numbers for nutrition values.
- Do separate meal records with flat borders and use tint for summaries.

### Don't:

- Don't add decorative animation to this diary; keep native navigation transitions.
- Don't use color alone to communicate errors or selected controls.
- Don't treat browser specimens as evidence of native device approval.
