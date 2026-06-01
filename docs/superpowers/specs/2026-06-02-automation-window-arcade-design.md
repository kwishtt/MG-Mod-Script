# Automation Window Arcade Redesign

## Goal

Redesign the `Automation` settings window into a cute arcade-style game panel inspired by mobile game menus, while preserving the current automation behavior and settings structure.

This redesign targets the existing scrollable `Automation` window itself, not the launcher HUD card and not unrelated windows.

## Scope

In scope:

- Restyle the `Automation` window shell, header, body, and section structure.
- Redesign the settings rows for modules such as `Pet Feed`, `Quick Harvest`, and related automation groups already rendered in the window.
- Replace the current flat white settings surface with arcade-inspired grouped panels.
- Redesign shared controls used inside this window: toggles, sliders, select fields, action buttons, badges, and section summaries.
- Add light motion and playful emphasis where it helps hierarchy and affordance.

Out of scope:

- Changing automation logic, defaults, or stored values.
- Redesigning the launcher HUD tile.
- Redesigning unrelated windows outside the `Automation` settings surface.
- Reworking information architecture beyond grouping and presentation inside the existing window.

## Visual Direction

### Style

- Cute arcade settings panel.
- Inspired by mobile game UI rather than soft pastel productivity UI.
- Rounded frames, strong outlines, bright but controlled colors, glossy button treatment, and chunky interactive controls.

### Palette

- Main panel family: cyan / light sky blue.
- Action family: orange for primary emphasis.
- Success / active family: fresh green.
- Neutral text: dark blue-gray for readability.
- Use brighter contrast than the current pastel pass, but keep enough restraint for a dense settings window.

### Feel

- Playful and game-like.
- More energetic than the previous pastel direction.
- Still readable for a long-form settings panel with many controls.

## UX Objectives

1. Make each automation group feel like a distinct game settings module instead of a continuous white form.
2. Improve scanability by separating labels, helper text, control surfaces, and current values more clearly.
3. Make primary actions and active states feel rewarding and obvious.
4. Keep the window practical for long settings forms despite the more expressive visual treatment.

## Layout

### Window model

The `Automation` UI remains a single scrollable settings window.

It is not converted into a dashboard of detached cards and it is not split into a launcher surface plus detail surface. The redesign applies arcade styling to the current settings-window pattern.

### Internal grouping

Each major automation area becomes a self-contained panel inside the window:

- `Pet Feed`
- `Quick Harvest`
- Other automation groups already rendered in the same window

Each panel should have:

- A clearer sub-header
- A more prominent frame
- Better separation between rows
- Optional summary or status badge near the header when useful

### Row composition

Each settings row should read in three layers:

- Setting label
- Supporting description
- Control area with current value emphasis

This is especially important for sliders, toggles, selects, and action rows.

## Control Treatment

### Toggles

- Larger, more playful toggle body
- Clear ON/OFF affordance
- Stronger active color
- Better separation from surrounding text

### Sliders

- Thicker track
- Brighter filled range
- Larger thumb
- Current numeric value displayed more prominently

### Selects

- Styled like capsule game controls rather than plain form fields
- Stronger border and hover state

### Buttons

- Primary action buttons use glossy orange or bright blue-green treatment depending on role
- Rounded and toy-like, but still compact enough for repeated use
- Manual action rows such as test-run actions should stand out clearly

## Motion

- Use restrained animation only
- Small hover lift, press feedback, and subtle glow are acceptable
- No distracting continuous animation on the full form

## Implementation Boundaries

- Edit the existing bundled userscript in place.
- Focus on the function that renders the `Automation` window and the CSS or helper layer it relies on.
- Reuse shared helper APIs where possible, but allow targeted custom styling for this window because it has a distinct visual language from the general settings theme.

## Risks

- The existing automation window is a dense form; over-styling can reduce readability.
- Shared helper changes may affect other settings windows if not scoped carefully.
- Bright game styling needs discipline so the result stays usable in a scrollable config screen.

## Verification

Implementation should verify:

- The `Automation` window still renders all current sections and controls.
- Toggles, sliders, selects, and buttons remain functional.
- The visual treatment is scoped to this window or intentionally shared only where appropriate.
- The bundled script still parses successfully.
