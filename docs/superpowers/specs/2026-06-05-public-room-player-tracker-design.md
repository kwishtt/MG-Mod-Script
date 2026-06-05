# Public Room Player Tracker Design

## Context

The main userscript already has AriesMod API support and a public Rooms tab. It can fetch public rooms with `fetchAvailableRooms(500)`, and each room may include `userSlots` with player display names and avatar URLs. The target friend does not run the mod, so the feature cannot rely on cross-client presence, stable `playerId`, friend presence events, or private room visibility.

## Goal

Add a tracker that lets the user pin player display names and quickly find matching public rooms. When a pinned player appears in public room slot data, that room should be shown at the top with a Join action.

This feature is best-effort. It is not a guaranteed online tracker.

## Non-Goals

- Do not claim to detect players in private rooms.
- Do not require the target player to install the mod.
- Do not auto-switch rooms.
- Do not infer identity from hidden or unavailable room data.
- Do not add a backend API.

## Data Sources

The tracker uses the existing public rooms data:

- `fetchAvailableRooms(limit)` from the AriesMod rooms endpoint.
- Cached public rooms from welcome data when available.
- Room fields: `id`, `playersCount`, `isPrivate`, `lastUpdatedAt`, and `userSlots`.
- Slot fields: `name` and `avatarUrl`.

## Matching Rules

Pinned targets are local records:

- `id`: local generated ID.
- `name`: required display name.
- `avatarUrl`: optional avatar URL captured from a previous match.
- `createdAt`: local timestamp.

Matching order:

1. Exact normalized name plus matching avatar URL.
2. Exact normalized name without avatar match.
3. No match.

Name normalization trims whitespace and compares case-insensitively. Fuzzy matching is out of scope for the first version because false positives are likely.

If multiple rooms match a pinned name, show all matches for that pinned player, ordered by strongest match first, then newest room update if available.

## UI

Add a pinned-player section to the existing Community Hub Rooms tab, above the normal public room list.

Controls:

- Text input for player display name.
- Pin button.
- Refresh button reuses the existing public room refresh behavior.

Pinned rows:

- Player name.
- Status: `Found`, `Not found`, or `Ambiguous` when multiple rooms match.
- Room ID badge when matched.
- Player count, such as `4/6`.
- Join button for matched rooms that are not full.
- Remove pin button.
- Optional avatar preview when available from a room slot.

Pinned rows with matches appear above not-found rows. The normal public room list remains below.

## Navigation

Joining a matched room uses the same behavior as the existing Rooms tab:

```js
window.location.href = `https://magicgarden.gg/r/${room.id}`;
```

The tracker never auto-joins. The user must click Join.

## Storage

Store pinned targets in local script storage using the existing Aries/local storage helpers if available. If those helpers are awkward at the insertion point, use `localStorage` with a namespaced key.

Proposed key:

```text
qws_public_room_player_pins
```

The stored format is a JSON array of pinned target objects.

## Error Handling

- If rooms fail to load, keep existing pins and show an error/empty state in the pinned section.
- If a pinned player is not found, keep the pin visible with `Not found`.
- If a matched room is full, disable Join and show `Full`.
- If the room API does not include `userSlots`, the pinned section may show all pins as `Not found`.

## Privacy And Accuracy

The UI should make the limitation visible through concise status labels, not long explanatory text. The feature only searches public room data returned to the current user. It may miss players when:

- The target is in a private room.
- The target is in a room not returned by the public rooms API.
- The room slot list omits the target.
- The target changed display name or avatar.

It may also produce false positives when multiple players use the same display name.

## Testing

Add focused tests against the bundled userscript source, following the existing test style:

- Pin storage helpers exist and use the expected storage key.
- Room matching prefers exact name plus avatar over exact name only.
- Pinned rows render before the normal room list.
- Join URL remains `https://magicgarden.gg/r/<roomId>`.
- Multiple matches are represented rather than collapsed silently.

Manual verification:

- Open the Rooms tab.
- Add a pinned name that exists in public room slots.
- Confirm matched pinned row appears above public rooms.
- Confirm Join navigates to the matched room URL.
- Confirm a non-existent pinned name remains visible as not found.
