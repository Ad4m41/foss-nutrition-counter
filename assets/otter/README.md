# Diary otter

Original artwork and animation created for Meal Diary with Rive CLI 1.3.0. Covered by the repository's GPL-3.0-only license; no third-party character assets or scripts.

- `scene.rml`: editable drawing, state machine and bindings.
- `otter.riv`: compiled, script-free runtime asset.
- `otter.svg` and `otter.png`: static fallback, generated from the drawing.
- Artboard/state machine: `Otter`; animation: `Idle` (4-second breathing/blinking loop).
- Number bindings: `bodyScale` (body width, app range 0.92–1.10) and `hydration` (droplet opacity, 0.15–1).

Regenerate from the repository root with the [Rive CLI](https://rive.app/docs/cli/getting-started):

```sh
rive assets/otter --verify
rive inspect assets/otter --summary
rive assets/otter --once
cp assets/otter/build/otter.riv assets/otter/otter.riv
rive assets/otter --screenshot --advance=1
python3 assets/otter/generate-fallback.py
```

To regenerate the PNG, render the SVG at 320×340 with a transparent background and 2× pixel density (for example, a Playwright Chromium screenshot with `omitBackground: true`). The SVG fallback approximates the rounded droplet with a polygon.

Native Rive runs only in an app built with its native modules, not Expo Go. The app uses the still on web, in Expo Go, while loading, on errors or with reduced motion, and unloads animation when backgrounded or the diary loses focus. Assets are bundled and do not require a Rive account or network access at runtime.
