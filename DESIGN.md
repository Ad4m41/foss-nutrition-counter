---
name: Meal Diary
description: A warm mobile nutrition diary with evergreen ink and apricot actions.
colors:
  light-bg: '#FAF7F2'
  light-surface: '#FFFFFF'
  light-tint: '#E7EDE5'
  light-text: '#263C32'
  light-muted: '#58645C'
  light-primary: '#284F3E'
  light-on-primary: '#FFFFFF'
  light-line: '#E6E5DD'
  light-danger: '#AB2634'
  light-danger-bg: '#FCEEF0'
  light-accent: '#F1BE9B'
  light-accent-text: '#543727'
  light-water: '#267B8D'
  light-water-tint: '#E5F2F2'
  light-protein: '#437F97'
  light-carbs: '#907445'
  light-fat: '#94608D'
  light-energy: '#A6533B'
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
  dark-accent: '#DAA781'
  dark-accent-text: '#30231A'
  dark-water: '#92CDD8'
  dark-water-tint: '#21383A'
  dark-protein: '#92C9DD'
  dark-carbs: '#DABD84'
  dark-fat: '#D5A4D2'
  dark-energy: '#EEAA8B'
typography:
  display:
    fontFamily: 'Manrope_800ExtraBold'
    fontSize: '32px'
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: '-0.7px'
  title:
    fontFamily: 'Manrope_700Bold'
    fontSize: '19px'
    fontWeight: 700
  body:
    fontFamily: 'Manrope_400Regular'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Manrope_600SemiBold'
    fontSize: '13px'
    fontWeight: 600
  macro-value:
    fontFamily: 'Manrope_800ExtraBold'
    fontSize: '16px'
    fontWeight: 800
  age-value:
    fontFamily: 'Manrope_800ExtraBold'
    fontSize: '40px'
    fontWeight: 800
rounded:
  field: '10px'
  control: '12px'
  date: '14px'
  surface: '16px'
  add: '18px'
  sheet: '24px'
spacing:
  compact: '4px'
  small: '8px'
  control: '12px'
  regular: '16px'
  page: '24px'
components:
  button-primary:
    backgroundColor: '{colors.light-primary}'
    textColor: '{colors.light-on-primary}'
    rounded: '{rounded.control}'
    padding: '14px 18px'
    height: '52px'
  button-secondary:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-primary}'
    rounded: '{rounded.control}'
    padding: '14px 18px'
    height: '52px'
  button-danger:
    backgroundColor: '{colors.light-danger-bg}'
    textColor: '{colors.light-danger}'
    rounded: '{rounded.control}'
    padding: '14px 18px'
    height: '52px'
  field:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.field}'
    padding: '12px'
    height: '50px'
  date-selected:
    backgroundColor: '{colors.light-primary}'
    textColor: '{colors.light-on-primary}'
    rounded: '{rounded.date}'
    height: '64px'
  macro-dock:
    backgroundColor: '{colors.light-surface}'
    textColor: '{colors.light-text}'
    rounded: '16px 16px 0 0'
    padding: '9px 16px'
  add-action:
    backgroundColor: '{colors.light-accent}'
    textColor: '{colors.light-accent-text}'
    rounded: '{rounded.add}'
    width: '58px'
    height: '58px'
  segmented:
    backgroundColor: '{colors.light-tint}'
    textColor: '{colors.light-primary}'
    rounded: '{rounded.surface}'
    padding: '4px'
  water-container:
    backgroundColor: '{colors.light-water-tint}'
    textColor: '{colors.light-text}'
    rounded: '{rounded.surface}'
    padding: '18px'
---

# Design System: Meal Diary

## Overview

**Creative North Star: "The Warm Meal Journal"**

Use warm cream pages, evergreen ink and apricot add controls for a calm, food-first mobile diary. Bundle Manrope for headings, labels and figures. Keep meal photos and nutrition legible in both system color schemes.

This document records the implemented source and approved visual direction. Browser captures support layout review; Android/iOS rendering and wheel gestures still need device review. Keep surface composition decisions in `.impeccable/surfaces/mobile.md`.

**Key Characteristics:**

- Warm cream and paired evergreen themes.
- Bundled Manrope with tabular nutrition figures.
- Apricot add controls and four labeled macro colors.
- Flat surfaces, open meal rows and rounded controls.

## Colors

The frontmatter records the current light and dark roles. `src/components/ui.tsx` remains the implementation source of truth.

### Primary

Evergreen covers primary actions, selected dates and active navigation. Pale green replaces it in dark mode; use the corresponding on-primary ink.

### Secondary

Apricot marks the central add control, empty-state food icon and selected goal icons. Use accent-text on its fill.

### Tertiary

Energy uses terracotta, protein blue, carbohydrates ochre and fat mauve. Use water blue with its own tinted container. Keep nutrient names and units beside these colors. The light energy token includes the contrast correction used for meal calorie text.

### Neutral

Warm cream covers the page; white surfaces group controls and totals. Evergreen text and muted ink carry the hierarchy. Thin line roles separate rows and form progress rails. Dark mode uses forest surfaces and pale ink. Danger foreground and surface roles mark errors and destructive actions.

**The Semantic Pair Rule.** Switch foreground and background roles together when the system color scheme changes.

## Typography

Bundle Manrope Regular (400), SemiBold (600), Bold (700) and ExtraBold (800) through the root font loader’s package imports. Use the family aliases in `fonts` from `ui.tsx`; the app loads the font assets before navigation.

Use ExtraBold for screen headings (32), macro totals (16), age values (40) and estimated calories (36). Profile headings use a 40-unit line height and −0.7 tracking. Use Bold for section titles (19–21) and meal names (18), Regular for body text (15/24), and SemiBold for field labels (13). Macro labels and units use 11; date weekdays use 10. Some notices and supporting nutrition labels retain platform text in the current source.

**The Stable Numbers Rule.** Use tabular numbers for nutrition, water totals and the age wheel.

## Layout

Use a single scrolling column with 24-unit page padding and a centered content width capped at 560. Keep footer actions outside the scroll region. Respect device safe areas and the keyboard. Measurements in this document are React Native layout units; frontmatter uses px for portable previews.

The diary has five date cells when available content width is below 360 and seven otherwise. Cells are 64 units tall; this switch keeps date targets at least 48 units wide on reviewed phone widths. Keep the fixed four-column macro strip flush against the custom tab bar, spanning the screen with rounded top corners only. Large text can increase content height; preserve scrolling and wrapping.

## Elevation & Depth

Use flat fills, thin dividers and tinted containers. The current components have no shadow tokens. The add sheet uses a translucent black backdrop and rounded top corners to establish depth.

## Shapes

Use softly rounded fields and controls, with larger corners for containers and sheets. Keep progress rails thin (5 units) and clipped. Meal photos and placeholders use the same 88-by-96 silhouette with 16-unit corners. Reserve the 58-unit apricot square with 18-unit corners for the central add action.

## Components

- **Buttons:** Primary evergreen, secondary leaf tint and danger rose tint. Minimum height 52, 14-by-18 padding and 12-unit corners. Pressed opacity is 0.8; loading and disabled opacity is 0.55. Icon controls have 48-unit targets.
- **Fields and notices:** Visible labels above white or forest fields, a one-unit border, 50-unit minimum height and 10-unit corners. Notices use tint or danger surface, 16-unit padding and 12-unit corners. Error notices announce their text.
- **Dates and meal rows:** Selected dates use primary/on-primary roles. Meal rows stay open with thin dividers, food photos or a restaurant placeholder, a visible calorie line and compact macro units.
- **Macro dock:** Four equal columns for energy, protein, carbohydrates and fat, each with a labeled colored rail. Tap the surface to open all nutrient details. A missing optional macro goal leaves its rail empty and shows grams without a target. Below a goal, the rail shows progress toward it. Above a goal, the rail represents the consumed amount: the nutrient color occupies goal/consumed and the excess color occupies (consumed−goal)/consumed. Display actual intake, goal and numeric excess. The strip uses 16-unit values and 9-unit vertical padding, with a subtle intensity-18 backdrop blur and an 80% theme surface wash. It overlays the scrolling content; bottom content padding tracks its measured height. Android before version 12 uses a translucent fallback.
- **Navigation and add sheet:** Diary and settings flank the central apricot add action. Open the add sheet with AI meal entry as the primary action, then manual entry and product checks; retain the selected diary date for a meal. Selected tabs show a tinted icon background and filled icon. Press scale animates over 110 ms and selection over 220 ms, respecting reduced motion. Tab targets are 64 units tall and the bar includes the bottom safe-area inset.
- **Meal input and questions:** Default to photo and/or description, with camera and gallery controls sharing equal-width columns. Keep the manual editor behind an explicit alternative or the AI result. Ask only for material uncertainty, with at most three labeled recommended/optional questions. Use the existing segmented control for yes/no/unknown, the bundled native slider for numeric amounts, and a multiline field for text. Untouched sliders do not submit a value. Keep skip and refine actions in the footer; every question is skippable. Failed refinement preserves the answers and the provisional result.
- **Product check:** A dedicated screen accepts text and optional label photo, then presents the explanation with strengths, concerns, allergens, uncertainty and advice. Changing input clears the old explanation. Loading, cancel, consent, key, quota, local-limit and network states preserve the input.
- **AI usage:** Settings includes a daily request limit, reported token totals and expandable history rows, revealed in batches of 20. Missing token counts stay explicitly unknown.
- **Profile:** Three steps cover body data, five activity levels and a goal. The 18–100 age wheel shows five rows, snaps at a row height of 56 scaled with text size, and exposes adjustable accessibility actions plus 48-unit increment/decrement buttons. Sex selection uses a two-part segmented control. Activity offers a stepped slider and five labeled buttons; the selected detail includes PAL. Keep continue/save reachable in the footer.
- **Water:** A blue-tinted top container groups the numeric total, goal rail and expandable guidance. Equal-width +250 ml / −250 ml controls sit below it, separated by a 4-unit gap. The four outer silhouette corners use 16 units; corners facing the 4-unit gaps use 6 units. Subtraction is disabled at zero.
- **Settings:** Account and App use a compact fixed section bar above the bottom navigation: small icons and 12-unit labels inside 48-unit touch targets. Account contains profile and targets; App settings contains AI, language and local data controls. Each sub-tab saves its own fields. Flags use bundled raster images, not emoji.
- **Feedback:** Brief selection ticks for stepped sliders, segments and tabs, light impacts for buttons. Rate-limit pulses to 80 ms; unsupported devices retain normal actions.
- **Meal details:** Keep the extra-nutrient disclosure above its fields and use that same upper control for collapse. Separate estimation notes from meal totals by 24 units.

Use system reduced motion for the segmented selection (240 ms), progress rails (420 ms) and add-sheet entrance (260 ms). Remove the age wheel’s cylinder transforms and animated scrolling when reduced motion is on. Keep its controls usable.

Sidecar HTML/CSS specimens translate the native components for the design panel. They use resolved light-theme values and depend on the host for bundled Manrope; they do not exercise native gestures or navigation.

## Do's and Don'ts

### Do:

- Do use the paired light and dark roles from `src/components/ui.tsx`.
- Do keep labels, units and selected states visible alongside color.
- Do preserve text scaling, wrapping and at least 48-unit touch targets.
- Do keep optional macro goals empty until the user supplies them.
- Do display unknown nutrient values and incomplete-data guidance.
- Do respect reduced motion in wheel transforms, progress and sheet transitions.

### Don't:

- Don't replace bundled Manrope with platform typography for the main hierarchy.
- Don't invent personalized macro targets or fill absent goals.
- Don't treat web captures or sidecar specimens as native device approval.
