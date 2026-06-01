# Automation Window Arcade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the existing `Automation` settings window into a scoped arcade-style settings panel while preserving every current control, event handler, and automation behavior.

**Architecture:** Keep the work inside the existing bundled userscript and target `renderAutomationMenu(container)` as the main composition point. Add a small set of automation-specific DOM helpers plus scoped CSS in the shared style layer so the window gets a distinct arcade look without unintentionally restyling unrelated menus.

**Tech Stack:** Bundled browser JavaScript userscript, DOM APIs, existing `Menu` helper surface, scoped CSS injected by `ensureStyles()`, `node --check` for parse verification.

---

## File Structure

- Modify: `quinoa-ws.min.user.js:15645-16280`
  - Extend the shared injected stylesheet with a scoped `.qmm-automation-arcade` visual system for the automation window shell, section cards, row layout, slider/toggle/select/button polish, status badges, and log surface.
- Modify: `quinoa-ws.min.user.js:64525-65180`
  - Replace the current flat `makeRow()` / `makeSection()` implementation in `renderAutomationMenu(container)` with automation-specific helper builders and an arcade settings composition.
- Reference: `docs/superpowers/specs/2026-06-02-automation-window-arcade-design.md`
  - Visual and UX source of truth for scope and treatment.

## Task 1: Add Scoped Automation Arcade CSS

**Files:**
- Modify: `quinoa-ws.min.user.js:15645-16280`
- Test: `quinoa-ws.min.user.js`

- [ ] **Step 1: Define the automation CSS surface before editing markup**

Add a scoped CSS block inside `ensureStyles()` for the automation window so later DOM work has stable class targets:

```js
.qmm-automation-arcade {
  --arcade-bg: linear-gradient(180deg, #f7fdff 0%, #dff4ff 100%);
  --arcade-panel: linear-gradient(180deg, #d8f2ff 0%, #bdeaff 100%);
  --arcade-panel-edge: #9b5a21;
  --arcade-panel-shadow: rgba(39, 120, 176, 0.24);
  --arcade-title: linear-gradient(180deg, #ff8f33 0%, #ff5e1f 100%);
  --arcade-title-edge: #9f3f12;
  --arcade-accent: #34b3ff;
  --arcade-success: #59cf74;
  --arcade-text: #234765;
  --arcade-muted: #567791;
  --arcade-cream: #fff9ec;
}
.qmm-automation-arcade .qmm-card { ... }
.qmm-automation-arcade .qmm-automation-shell { ... }
.qmm-automation-arcade .qmm-automation-section { ... }
.qmm-automation-arcade .qmm-automation-row { ... }
.qmm-automation-arcade .qmm-automation-value { ... }
.qmm-automation-arcade .qmm-automation-log { ... }
```

- [ ] **Step 2: Run a syntax smoke check before any structural changes**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 3: Implement the minimal CSS for the arcade shell and controls**

Cover these exact selectors so the later markup can rely on them:

```js
.qmm-automation-arcade .qmm-automation-shell {
  display: grid;
  gap: 16px;
  padding: 18px;
  border-radius: 24px;
  border: 4px solid var(--arcade-panel-edge);
  background: var(--arcade-bg);
  box-shadow:
    0 18px 36px var(--arcade-panel-shadow),
    inset 0 0 0 3px rgba(255,255,255,0.68);
}
.qmm-automation-arcade .qmm-automation-hero {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 3px solid var(--arcade-title-edge);
  background: linear-gradient(180deg, #fff0bf 0%, #ffe28a 100%);
}
.qmm-automation-arcade .qmm-automation-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 20px;
  border: 3px solid var(--arcade-panel-edge);
  background: var(--arcade-panel);
}
.qmm-automation-arcade .qmm-automation-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  border: 2px solid rgba(95, 157, 200, 0.35);
  background: rgba(255,255,255,0.62);
}
```

- [ ] **Step 4: Re-run syntax verification after the CSS block lands**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 5: Commit the CSS-only slice**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: add scoped arcade styles for automation window"
```

## Task 2: Recompose the Automation Window Shell and Section Builders

**Files:**
- Modify: `quinoa-ws.min.user.js:64525-64740`
- Test: `quinoa-ws.min.user.js`

- [ ] **Step 1: Replace the current flat row/section helpers with automation-specific builders**

Swap the existing inline dark helpers for scoped builders that emit stable classes:

```js
const makeAutomationValue = (text) => {
  const chip = document.createElement("span");
  chip.className = "qmm-automation-value";
  chip.textContent = text;
  return chip;
};

const makeAutomationRow = (title, description, control, opts = {}) => {
  const row = document.createElement("div");
  row.className = "qmm-automation-row";
  const text = document.createElement("div");
  text.className = "qmm-automation-row-copy";
  const titleEl = document.createElement("div");
  titleEl.className = "qmm-automation-row-title";
  titleEl.textContent = title;
  const desc = document.createElement("div");
  desc.className = "qmm-automation-row-desc";
  desc.textContent = description;
  text.append(titleEl, desc);
  if (opts.badge) text.append(opts.badge);
  row.append(text, control);
  return row;
};

const makeAutomationSection = (title, description, children, opts = {}) => {
  const section = document.createElement("section");
  section.className = "qmm-automation-section";
  const head = document.createElement("div");
  head.className = "qmm-automation-section-head";
  const titleEl = document.createElement("div");
  titleEl.className = "qmm-automation-section-title";
  titleEl.textContent = title;
  const desc = document.createElement("div");
  desc.className = "qmm-automation-section-desc";
  desc.textContent = description;
  head.append(titleEl, desc);
  if (opts.summary) head.append(opts.summary);
  section.append(head, ...children);
  return section;
};
```

- [ ] **Step 2: Run a syntax smoke check on the helper replacement**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 3: Rebuild the card body into an arcade shell without changing control wiring**

Inside `renderAutomationMenu(container)`, wrap the content in a dedicated shell and hero block:

```js
card2.root.classList.add("qmm-automation-arcade");
card2.body.className = "qmm-automation-shell";

const hero = document.createElement("section");
hero.className = "qmm-automation-hero";
const heroTitle = document.createElement("div");
heroTitle.className = "qmm-automation-hero-title";
heroTitle.textContent = "Automation";
const heroDesc = document.createElement("div");
heroDesc.className = "qmm-automation-hero-desc";
heroDesc.textContent = "Tách riêng Pet Feed và Thu hoạch nhanh để dễ thao tác.";
hero.append(heroTitle, heroDesc);
```

Do not remove any existing listeners or state reads in this step. This step only changes shell composition and class hooks.

- [ ] **Step 4: Re-run syntax verification after the shell rebuild**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 5: Commit the shell and helper rebuild**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: rebuild automation settings shell"
```

## Task 3: Restyle Pet Feed and Quick Harvest Rows as Arcade Controls

**Files:**
- Modify: `quinoa-ws.min.user.js:64740-65140`
- Test: `quinoa-ws.min.user.js`

- [ ] **Step 1: Convert slider/toggle/select wrappers into explicit arcade control surfaces**

Replace the current plain wrappers with a control area that can show both the widget and emphasized value:

```js
const makeControlStack = (...nodes) => {
  const wrap = document.createElement("div");
  wrap.className = "qmm-automation-control";
  wrap.append(...nodes);
  return wrap;
};

const sliderWrap = (slider, valueEl) => {
  const wrap = document.createElement("div");
  wrap.className = "qmm-automation-slider-wrap";
  slider.classList.add("qmm-automation-slider");
  valueEl.className = "qmm-automation-value";
  wrap.append(slider, valueEl);
  return wrap;
};

speedMode.classList.add("qmm-automation-select");
quickSpeedMode.classList.add("qmm-automation-select");
quickSelect.classList.add("qmm-automation-select");
```

- [ ] **Step 2: Run syntax verification after the wrapper conversion**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 3: Recompose the two sections using the new builders and visible summaries**

Build each section with a summary chip and keep the current rows in the same behavioral order:

```js
const petFeedSummary = makeAutomationValue(enabled.checked ? "AUTO ON" : "AUTO OFF");
const quickSummary = makeAutomationValue(quickEnabled.checked ? "AUTO ON" : "AUTO OFF");

const petFeedSection = makeAutomationSection(
  "Pet Feed",
  "Tự kiểm tra độ đói, tìm thức ăn, thu hoạch nếu cần rồi cho pet ăn.",
  [
    makeAutomationRow("Bật tự động", "Quét pet theo khoảng thời gian bên dưới.", makeControlStack(enabled)),
    makeAutomationRow("Ngưỡng đói", "Pet thấp hơn ngưỡng này sẽ bắt đầu được xử lý.", sliderWrap(threshold, thresholdValue)),
    makeAutomationRow("Ngưỡng dừng", "Khi đang feed, đạt ngưỡng này thì dừng.", sliderWrap(stop, stopValue)),
    makeAutomationRow("Khoảng quét", "Thời gian giữa mỗi lần kiểm tra tự động.", sliderWrap(interval, intervalValue)),
    makeAutomationRow("Tốc độ Pet Feed", "Khoảng nghỉ giữa các lệnh feed và thu hoạch phục vụ pet.", makeControlStack(speedMode)),
    makeAutomationRow("Cho phép thu hoạch", "Nếu túi đồ không có thức ăn phù hợp, chọn ngẫu nhiên một cây phù hợp và thu hoạch cả cây.", makeControlStack(harvest)),
    makeAutomationRow("Chạy thủ công", "Chạy một lượt Pet Feed ngay để kiểm tra cấu hình.", makeControlStack(actions))
  ],
  { summary: petFeedSummary }
);
```

Mirror the same pattern for `quickHarvestSection`, keeping `quickEnabled`, `quickIntervalWrap`, `quickSpeedMode`, `quickAutoSell`, and `quickActions`.

- [ ] **Step 4: Update summary chips when toggles change**

Extend the existing change handlers without altering storage logic:

```js
const syncSectionBadges = () => {
  petFeedSummary.textContent = enabled.checked ? "AUTO ON" : "AUTO OFF";
  quickSummary.textContent = quickEnabled.checked ? "AUTO ON" : "AUTO OFF";
};

syncSectionBadges();
enabled.addEventListener("change", syncSectionBadges);
quickEnabled.addEventListener("change", syncSectionBadges);
```

- [ ] **Step 5: Commit the section recomposition**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: convert automation sections to arcade rows"
```

## Task 4: Rebuild Status and Log Surfaces for the Arcade Window

**Files:**
- Modify: `quinoa-ws.min.user.js:64600-65180`
- Test: `quinoa-ws.min.user.js`

- [ ] **Step 1: Replace the current plain status block and log container class hooks**

Change the status and log DOM setup to use scoped classes instead of dark inline styles:

```js
status.className = "qmm-automation-status";
logSection.className = "qmm-automation-log";
logHeader.className = "qmm-automation-log-head";
logTitle.className = "qmm-automation-log-title";
logList.className = "qmm-automation-log-list";
clearLog.classList.add("qmm-automation-log-clear");
```

- [ ] **Step 2: Run syntax verification after the status/log rebuild**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits `0` with no output.

- [ ] **Step 3: Append the final body in arcade order**

Use this final assembly order:

```js
card2.body.replaceChildren(
  hero,
  petFeedSection,
  quickHarvestSection,
  status,
  logSection
);
```

Keep `unsubStatus()` and `unsubLog()` cleanup untouched.

- [ ] **Step 4: Run full smoke verification**

Run:

```bash
node --check quinoa-ws.min.user.js
rg -n "qmm-automation-arcade|qmm-automation-section|qmm-automation-log" quinoa-ws.min.user.js
```

Expected:
- `node --check` exits `0`
- `rg` prints the new scoped automation selectors and the updated render function references

- [ ] **Step 5: Commit the status/log restyle**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: restyle automation status and log surfaces"
```

## Task 5: Manual UI Verification in the Running Game

**Files:**
- Test: `quinoa-ws.min.user.js`

- [ ] **Step 1: Open the Automation window and verify shell framing**

Manual checklist:

```text
- Outer card is cyan/light-blue instead of flat white
- Header and hero area read as arcade panel, not neutral form
- Window remains one scrollable settings surface
- No unrelated menu outside Automation inherits the arcade shell
```

- [ ] **Step 2: Verify every control type still works**

Manual checklist:

```text
- Pet Feed toggle changes state and persists
- Hunger/stop/interval sliders update visible values live
- Speed selects still open and persist the selected option
- "Chạy thử ngay", "Làm mới", "Thu hoạch ngay", and "Dừng" still trigger their previous behaviors
- Quick Harvest auto toggle and interval still schedule correctly
```

- [ ] **Step 3: Verify readable density and scroll behavior**

Manual checklist:

```text
- Long descriptions do not collide with controls
- Value chips remain visible on narrow widths
- Log list is readable and scrollable
- Bright colors do not reduce contrast for labels or values
```

- [ ] **Step 4: Capture the final diff and syntax check**

Run:

```bash
node --check quinoa-ws.min.user.js
git diff -- quinoa-ws.min.user.js
```

Expected:
- `node --check` exits `0`
- `git diff` shows only scoped automation-window UI changes plus any pre-existing unrelated edits already in the worktree

- [ ] **Step 5: Commit the verified implementation**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: redesign automation window as arcade settings panel"
```

## Self-Review

- Spec coverage:
  - Window remains a single scrollable settings surface: Task 2, Task 4, Task 5.
  - Grouped arcade panels for `Pet Feed` and `Quick Harvest`: Task 3.
  - Larger, clearer toggles/sliders/selects/buttons and value emphasis: Task 1 and Task 3.
  - Scoped CSS to avoid contaminating unrelated windows: Task 1 and Task 5.
  - Status/log surfaces brought into the same visual language: Task 4.
- Placeholder scan:
  - No `TODO`, `TBD`, or “similar to above” placeholders remain.
- Type consistency:
  - Helper names are consistent across tasks: `makeAutomationRow`, `makeAutomationSection`, `makeAutomationValue`, `makeControlStack`, `syncSectionBadges`.
