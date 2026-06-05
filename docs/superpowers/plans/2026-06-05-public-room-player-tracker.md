# Public Room Player Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a best-effort pinned player tracker to the Community Hub Rooms tab using public room slot data.

**Architecture:** Implement small helper functions inside the existing bundled Rooms tab module in `quinoa-ws.min.user.js`: pinned storage, room-slot matching, and UI rendering. Reuse the existing public rooms refresh flow and join URL behavior; pinned matches render above the normal public room list.

**Tech Stack:** Tampermonkey userscript JavaScript bundle, DOM APIs, existing AriesMod rooms API helpers, Node.js built-in test runner.

---

## File Structure

- Modify `quinoa-ws.min.user.js`: add tracker helpers near `createRoomTab`, extend the Rooms tab controls/rendering, and keep normal room list behavior intact.
- Modify `tests/automation-quick-harvest-autosell.test.js`: add source-level regression tests because this repo tests the bundled userscript text directly.

## Task 1: Add Source-Level Tests For Tracker Helpers

**Files:**
- Modify: `tests/automation-quick-harvest-autosell.test.js`
- Test: `tests/automation-quick-harvest-autosell.test.js`

- [ ] **Step 1: Write failing tests**

Append these tests after the existing room/quick-log tests in `tests/automation-quick-harvest-autosell.test.js`:

```js
test("public room player tracker persists pins with namespaced storage", () => {
  assert.match(source, /PUBLIC_ROOM_PLAYER_PINS_KEY = "qws_public_room_player_pins"/);
  assert.match(source, /function readPublicRoomPlayerPins\(\)/);
  assert.match(source, /function writePublicRoomPlayerPins\(pins\)/);
  assert.match(source, /localStorage\.getItem\(PUBLIC_ROOM_PLAYER_PINS_KEY\)/);
  assert.match(source, /localStorage\.setItem\(PUBLIC_ROOM_PLAYER_PINS_KEY, JSON\.stringify\(safe\)\)/);
});

test("public room player tracker prefers exact name plus avatar matches", () => {
  assert.match(source, /function normalizePublicRoomPlayerName\(name\)/);
  assert.match(source, /function findPublicRoomPlayerMatches\(pins, rooms\)/);
  assert.match(source, /const score = pin\.avatarUrl && slotAvatar && String\(pin\.avatarUrl\) === String\(slotAvatar\) \? 2 : 1;/);
  assert.match(source, /matches\.sort\(\(a, b\) => b\.score - a\.score \|\| b\.updatedAtMs - a\.updatedAtMs\)/);
});

test("public room player tracker renders before normal rooms and keeps join URL behavior", () => {
  assert.match(source, /const pinnedTracker = document\.createElement\("div"\);/);
  assert.match(source, /renderPinnedTracker\(allRooms\);/);
  assert.match(source, /root\.append\(controlsContainer, pinContainer, pinnedTracker, roomsList, footer\);/);
  assert.match(source, /window\.location\.href = `https:\/\/magicgarden\.gg\/r\/\$\{match\.room\.id\}`;/);
  assert.match(source, /window\.location\.href = `https:\/\/magicgarden\.gg\/r\/\$\{room\.id\}`;/);
});

test("public room player tracker represents multiple matches instead of collapsing silently", () => {
  assert.match(source, /const statusText = matches\.length > 1 \? "Ambiguous" : matches\.length === 1 \? "Found" : "Not found";/);
  assert.match(source, /for \(const match of matches\) \{/);
  assert.match(source, /match\.slot\?\.name \|\| pin\.name/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
node --test tests/automation-quick-harvest-autosell.test.js
```

Expected: FAIL with missing `PUBLIC_ROOM_PLAYER_PINS_KEY`, `readPublicRoomPlayerPins`, and tracker render patterns.

- [ ] **Step 3: Commit failing tests**

Do not commit yet; continue to Task 2 so the repo is not left with failing tests.

## Task 2: Implement Pin Storage And Matching Helpers

**Files:**
- Modify: `quinoa-ws.min.user.js`
- Test: `tests/automation-quick-harvest-autosell.test.js`

- [ ] **Step 1: Add helper implementation near `createRoomTab`**

Insert this block immediately before `function createRoomTab() {`:

```js
  var PUBLIC_ROOM_PLAYER_PINS_KEY = "qws_public_room_player_pins";
  function normalizePublicRoomPlayerName(name) {
    return String(name ?? "").trim().toLowerCase();
  }
  function makePublicRoomPlayerPinId() {
    return `pin-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
  function sanitizePublicRoomPlayerPin(pin) {
    const name = String(pin?.name || "").trim();
    if (!name) return null;
    return {
      id: String(pin?.id || makePublicRoomPlayerPinId()),
      name,
      avatarUrl: pin?.avatarUrl ? String(pin.avatarUrl) : "",
      createdAt: Number(pin?.createdAt) || Date.now()
    };
  }
  function readPublicRoomPlayerPins() {
    try {
      const raw = localStorage.getItem(PUBLIC_ROOM_PLAYER_PINS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map(sanitizePublicRoomPlayerPin).filter(Boolean);
    } catch {
      return [];
    }
  }
  function writePublicRoomPlayerPins(pins) {
    const safe = Array.isArray(pins) ? pins.map(sanitizePublicRoomPlayerPin).filter(Boolean) : [];
    try {
      localStorage.setItem(PUBLIC_ROOM_PLAYER_PINS_KEY, JSON.stringify(safe));
    } catch {
    }
    return safe;
  }
  function findPublicRoomPlayerMatches(pins, rooms) {
    const normalizedPins = Array.isArray(pins) ? pins : [];
    const normalizedRooms = Array.isArray(rooms) ? rooms : [];
    return normalizedPins.map((pin) => {
      const target = normalizePublicRoomPlayerName(pin.name);
      const matches = [];
      for (const room of normalizedRooms) {
        const slots = Array.isArray(room?.userSlots) ? room.userSlots : [];
        for (const slot of slots) {
          const slotName = normalizePublicRoomPlayerName(slot?.name);
          if (!target || slotName !== target) continue;
          const slotAvatar = slot?.avatarUrl || slot?.avatar_url || "";
          const score = pin.avatarUrl && slotAvatar && String(pin.avatarUrl) === String(slotAvatar) ? 2 : 1;
          const updatedAtMs = room?.lastUpdatedAt ? new Date(room.lastUpdatedAt).getTime() || 0 : 0;
          matches.push({ pin, room, slot, score, updatedAtMs, slotAvatar });
        }
      }
      matches.sort((a, b) => b.score - a.score || b.updatedAtMs - a.updatedAtMs);
      return { pin, matches };
    });
  }
```

- [ ] **Step 2: Run tests**

Run:

```bash
node --test tests/automation-quick-harvest-autosell.test.js
```

Expected: tests still FAIL because UI patterns are not implemented yet; storage and matching test expectations should now be closer.

## Task 3: Add Tracker UI To Rooms Tab

**Files:**
- Modify: `quinoa-ws.min.user.js`
- Test: `tests/automation-quick-harvest-autosell.test.js`

- [ ] **Step 1: Extend `createRoomTab` with tracker state and controls**

Inside `createRoomTab`, after `const root = document.createElement("div");` and style setup, add:

```js
    let pinnedPlayers = readPublicRoomPlayerPins();
```

After `controlsContainer.append(filterSelect, refreshButton);`, add:

```js
    const pinContainer = document.createElement("div");
    style2(pinContainer, {
      display: "flex",
      gap: "8px",
      alignItems: "center"
    });
    const pinInput = document.createElement("input");
    pinInput.type = "text";
    pinInput.placeholder = "Pin player name...";
    style2(pinInput, {
      flex: "1",
      padding: "10px 14px",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px",
      background: "rgba(255,255,255,0.04)",
      color: "#e7eef7",
      fontSize: "13px",
      outline: "none"
    });
    const pinButton = document.createElement("button");
    pinButton.textContent = "Pin";
    style2(pinButton, {
      padding: "10px 16px",
      border: "1px solid rgba(94,234,212,0.3)",
      borderRadius: "10px",
      background: "rgba(94,234,212,0.12)",
      color: "#5eead4",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "700"
    });
    pinContainer.append(pinInput, pinButton);
    const pinnedTracker = document.createElement("div");
    style2(pinnedTracker, {
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    });
```

- [ ] **Step 2: Add tracker rendering helpers inside `createRoomTab`**

Insert this block after the existing `createRoomCard2` function, immediately after the line `return card2;` and its closing `};`, and before `const loadRooms = async`:

```js
    const createPinnedJoinButton = (match) => {
      const btn = document.createElement("button");
      const isFull = Number(match?.room?.playersCount) >= 6;
      btn.textContent = isFull ? "Full" : "Join";
      btn.disabled = isFull;
      style2(btn, {
        padding: "6px 12px",
        border: isFull ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(94,234,212,0.35)",
        borderRadius: "6px",
        background: isFull ? "rgba(255,255,255,0.03)" : "rgba(94,234,212,0.1)",
        color: isFull ? "rgba(226,232,240,0.4)" : "#5eead4",
        fontSize: "12px",
        fontWeight: "700",
        cursor: isFull ? "not-allowed" : "pointer",
        flexShrink: "0"
      });
      if (!isFull) {
        btn.onclick = () => {
          window.location.href = `https://magicgarden.gg/r/${match.room.id}`;
        };
      }
      return btn;
    };
    const renderPinnedTracker = (rooms) => {
      pinnedTracker.innerHTML = "";
      if (!pinnedPlayers.length) return;
      const title = document.createElement("div");
      style2(title, {
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.07em",
        color: "rgba(226,232,240,0.45)",
        textTransform: "uppercase"
      });
      title.textContent = "Pinned players";
      pinnedTracker.appendChild(title);
      const groups2 = findPublicRoomPlayerMatches(pinnedPlayers, rooms).sort((a, b) => {
        const am = a.matches.length ? 1 : 0;
        const bm = b.matches.length ? 1 : 0;
        return bm - am || String(a.pin.name).localeCompare(String(b.pin.name));
      });
      for (const group of groups2) {
        const pin = group.pin;
        const matches = group.matches;
        const row = document.createElement("div");
        style2(row, {
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "10px 12px",
          border: matches.length ? "1px solid rgba(94,234,212,0.22)" : "1px solid rgba(255,255,255,0.07)",
          borderRadius: "10px",
          background: matches.length ? "rgba(94,234,212,0.07)" : "rgba(255,255,255,0.025)"
        });
        const header = document.createElement("div");
        style2(header, { display: "flex", alignItems: "center", gap: "8px" });
        const name = document.createElement("div");
        style2(name, { flex: "1", minWidth: "0", color: "#e7eef7", fontSize: "12px", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
        name.textContent = matches[0]?.slot?.name || pin.name;
        const status = document.createElement("div");
        const statusText = matches.length > 1 ? "Ambiguous" : matches.length === 1 ? "Found" : "Not found";
        status.textContent = statusText;
        style2(status, { color: matches.length ? "#5eead4" : "rgba(226,232,240,0.45)", fontSize: "11px", fontWeight: "700", flexShrink: "0" });
        const remove = document.createElement("button");
        remove.textContent = "Remove";
        style2(remove, { border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px", background: "rgba(239,68,68,0.08)", color: "#fca5a5", fontSize: "11px", padding: "5px 8px", cursor: "pointer", flexShrink: "0" });
        remove.onclick = () => {
          pinnedPlayers = writePublicRoomPlayerPins(pinnedPlayers.filter((p) => p.id !== pin.id));
          renderPinnedTracker(allRooms);
        };
        header.append(name, status, remove);
        row.appendChild(header);
        if (matches.length) {
          for (const match of matches) {
            const matchRow = document.createElement("div");
            style2(matchRow, { display: "flex", alignItems: "center", gap: "8px" });
            const avatar = document.createElement("div");
            const avatarUrl = match.slotAvatar || match.slot?.avatarUrl || match.slot?.avatar_url || "";
            style2(avatar, {
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: avatarUrl ? `url(${avatarUrl}) center/cover` : "linear-gradient(135deg, rgba(94,234,212,0.2), rgba(59,130,246,0.2))",
              border: "1px solid rgba(94,234,212,0.28)",
              flexShrink: "0"
            });
            const roomMeta = document.createElement("div");
            style2(roomMeta, { flex: "1", minWidth: "0", color: "rgba(226,232,240,0.72)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
            const displayName = match.slot?.name || pin.name;
            roomMeta.textContent = `${match.room.id} · ${match.room.playersCount}/6 · ${displayName}`;
            matchRow.append(avatar, roomMeta, createPinnedJoinButton(match));
            row.appendChild(matchRow);
          }
        }
        pinnedTracker.appendChild(row);
      }
    };
```

- [ ] **Step 3: Wire add pin and render calls**

Add after `renderPinnedTracker`:

```js
    pinButton.onclick = () => {
      const pin = sanitizePublicRoomPlayerPin({ name: pinInput.value });
      if (!pin) return;
      const exists = pinnedPlayers.some((p) => normalizePublicRoomPlayerName(p.name) === normalizePublicRoomPlayerName(pin.name));
      if (!exists) {
        pinnedPlayers = writePublicRoomPlayerPins([...pinnedPlayers, pin]);
      }
      pinInput.value = "";
      renderPinnedTracker(allRooms);
    };
    pinInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        pinButton.click();
      }
    });
```

In `loadRooms`, after `allRooms = rooms;`, add:

```js
        renderPinnedTracker(allRooms);
```

In the `catch` block after `isLoading = false;`, add:

```js
        renderPinnedTracker(allRooms);
```

In `filterSelect.onchange`, before `renderRooms(filtered);`, add:

```js
      renderPinnedTracker(allRooms);
```

In the welcome callback branch after `allRooms = data.publicRooms;`, add:

```js
        renderPinnedTracker(allRooms);
```

Change the final append from:

```js
    root.append(controlsContainer, roomsList, footer);
```

to:

```js
    root.append(controlsContainer, pinContainer, pinnedTracker, roomsList, footer);
```

- [ ] **Step 4: Run tests**

Run:

```bash
node --test tests/automation-quick-harvest-autosell.test.js
```

Expected: PASS with all public room player tracker tests and existing tests green.

## Task 4: Polish And Verify

**Files:**
- Modify: `quinoa-ws.min.user.js`
- Modify: `tests/automation-quick-harvest-autosell.test.js`

- [ ] **Step 1: Run focused source checks**

Run:

```bash
rg -n "PUBLIC_ROOM_PLAYER_PINS_KEY|findPublicRoomPlayerMatches|renderPinnedTracker|Pinned players|Pin player name" quinoa-ws.min.user.js
```

Expected: all new helper and UI identifiers are present in `quinoa-ws.min.user.js`.

- [ ] **Step 2: Run full tests**

Run:

```bash
node --test tests/automation-quick-harvest-autosell.test.js
```

Expected: all tests pass.

- [ ] **Step 3: Review diff**

Run:

```bash
git diff -- quinoa-ws.min.user.js tests/automation-quick-harvest-autosell.test.js
```

Expected: diff only touches tracker tests and the Rooms tab tracker implementation.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add quinoa-ws.min.user.js tests/automation-quick-harvest-autosell.test.js docs/superpowers/plans/2026-06-05-public-room-player-tracker.md
git commit -m "feat: track pinned players in public rooms"
```

Expected: commit succeeds with the implementation and plan.
