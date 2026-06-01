# Pastel Blue-Green UI Redesign

## Goal

Refresh the userscript UI toward a cute, friendly, easy-to-use visual style while keeping the current product structure and behavior intact.

The redesign will favor a light pastel palette built around blue and green, use consistent inline SVG icons for common actions, and improve clarity across shared controls and a limited set of custom screens.

## Scope

In scope:

- Redesign the shared `qmm-*` UI system used by the main menu and related screens.
- Add a reusable inline SVG icon helper for common action icons.
- Polish prominent custom UI blocks that currently rely on one-off inline styles.
- Improve empty, error, selection, and confirmation states where they are already present.

Out of scope:

- Feature changes or automation logic changes.
- Rewriting the bundle into a multi-file source structure.
- Large content or language rewrites.
- Reordering product navigation or changing the overall information architecture.

## Design Direction

### Visual language

- Light pastel UI.
- Primary hue: pastel blue.
- Secondary hue: pastel green.
- Neutral surfaces: white, milk white, very pale blue.
- Text: dark blue-gray for readability on bright surfaces.
- Shadows and borders: soft, cool, and low-contrast.

### Tone

- Friendly and cute, but still usable as an overlay tool.
- Soft corners, gentle depth, and lighter surfaces instead of the current dark glass look.
- Avoid overly corporate dashboard styling.

## UX Objectives

1. Make the interface easier to scan by increasing contrast between structure and content without using harsh colors.
2. Make repeated actions feel more obvious through clearer button hierarchy, iconography, and state styling.
3. Reduce visual inconsistency between shared `qmm-*` components and custom inline-styled panels.
4. Improve perceived friendliness through rounded geometry, softer spacing, and expressive but restrained accents.

## Component Plan

### Shared system UI

The redesign will update the CSS injected by `Menu.ensureStyles()` and keep existing DOM structure and APIs stable.

Components to restyle:

- Window container and views panel
- Tabs and active tab states
- Cards and collapsible sections
- Buttons, including primary, secondary, ghost, danger, icon-only, and compact variants
- Text inputs and selects
- Switches, sliders, segmented controls, hotkey controls, and chip toggles
- Minimal tables, list rows, vertical tabs, badges, and helper text
- Error bars and generic status surfaces

### Custom UI polish

Custom interfaces outside the generic `qmm-*` path will receive targeted polish where they are prominent and visually inconsistent:

- Seed selection preview and confirmation flow
- Decor selection preview and confirmation flow
- Prominent confirmation dialogs with manual inline button styling
- Repeated empty states and placeholder states that currently render as plain text blocks

The intent is to improve these screens without altering logic or broadening scope into unrelated modules.

## Icon Strategy

Introduce a small inline SVG icon helper in the bundled UI layer.

Requirements:

- Map common action names such as `confirm`, `clear`, `remove`, `refresh`, `copy`, `open`, `play`, `search`, `settings`, and `list` to consistent SVG output.
- Support use in buttons, cards, chip toggles, and compact actions.
- Preserve compatibility with existing string labels and any non-mapped icon inputs.
- Prefer stroke-based icons with rounded joins and caps.

This icon helper will be used opportunistically where the current UI already presents action buttons, especially where text-only controls feel visually flat.

## Layout and State Rules

### Shared layout adjustments

- Increase spacing consistency between tabs, cards, rows, and form controls.
- Keep existing view composition and tab structure intact.
- Preserve compact variants for constrained overlays.

### State styling

- Empty states should read as intentional containers, not leftover text.
- Error states should stand out clearly but remain soft enough for the light palette.
- Active and selected states should use blue and green accents instead of the current cyan-on-dark approach.
- Disabled states should remain obvious without collapsing legibility.

## Accessibility and Interaction

- Maintain keyboard focus visibility on all interactive controls.
- Preserve current click targets and control semantics.
- Keep contrast high enough for legibility on bright panels.
- Keep motion subtle and avoid adding animation that could distract in a game overlay.

## Implementation Boundaries

- Edit the existing bundled userscript in place.
- Keep changes concentrated around the shared menu UI helpers, shared style injection, icon creation helpers, and a limited number of custom panels.
- Avoid deep refactors unless required to apply the icon helper cleanly.

## Verification

Verification for implementation will cover:

- Script parses successfully.
- Shared `qmm-*` controls render without missing classes or broken interactions.
- Buttons, inputs, tabs, cards, and selection states remain functional.
- Touched custom panels still open and show expected controls.

## Risks

- The codebase is a bundled userscript, so UI code is centralized and large; broad CSS edits can have cross-screen effects.
- Some custom panels use inline styles rather than shared classes, so visual consistency requires selective manual edits.
- Icon replacement must avoid breaking current call sites that pass plain strings or labels.

## Recommended Implementation Order

1. Add shared palette tokens and restyle the `qmm-*` system.
2. Add the inline SVG icon helper and wire it into shared UI button/card paths.
3. Polish high-visibility custom panels and state surfaces.
4. Verify visual states and script integrity.
