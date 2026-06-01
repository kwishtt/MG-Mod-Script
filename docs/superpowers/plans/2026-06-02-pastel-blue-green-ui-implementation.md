# Pastel Blue-Green UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the bundled userscript UI into a light pastel blue-green theme with consistent SVG action icons and polished custom overlay states, without changing product logic.

**Architecture:** Keep all changes inside the existing bundled userscript. Replace shared `qmm-*` theme tokens and component CSS in `Menu.ensureStyles()`, add a small inline SVG icon helper that plugs into the current `Menu.btn()` and related helpers, then apply targeted polish to the seed/decor selection overlays and other one-off action surfaces that still use manual inline styles.

**Tech Stack:** Bundled userscript JavaScript, DOM APIs, injected CSS, `git`, `rg`, `node --check`

---

## File Map

- Modify: `quinoa-ws.min.user.js`
  Responsibility: shared menu theme, button/card/icon helpers, seed/decor overlay styling, and small custom UI states.
- Create: `docs/superpowers/plans/2026-06-02-pastel-blue-green-ui-implementation.md`
  Responsibility: execution plan and task tracking.

No dedicated test suite exists in this repo. Verification will use targeted `rg` assertions plus `node --check quinoa-ws.min.user.js`.

### Task 1: Restyle the shared `qmm-*` system

**Files:**
- Modify: `quinoa-ws.min.user.js` in the `Menu.ensureStyles()` CSS block around the `.qmm`, `.qmm-tabs`, `.qmm-views`, `.qmm-btn`, `.qmm-card`, `.qmm-input`, `.qmm-table--minimal`, `.qmm-vtab`, `.qmm-hotkey`, and `.qmm-seg` rules

- [ ] **Step 1: Write the failing palette check**

```bash
rg -n --fixed-strings -- "--qmm-bg:        #f4fbff;" quinoa-ws.min.user.js
rg -n --fixed-strings -- ".qmm-tab.active{" quinoa-ws.min.user.js
```

Expected: the first command returns no match because the new light palette is not present yet, and the second confirms the existing tab rule is the shared entry point to edit.

- [ ] **Step 2: Run the check and capture the baseline**

Run: `rg -n --fixed-strings -- "--qmm-bg:        #f4fbff;" quinoa-ws.min.user.js`

Expected: exit status `1` with no output.

- [ ] **Step 3: Replace the dark shared tokens and control surfaces with the pastel blue-green palette**

Update the `css3` string inside `Menu.ensureStyles()` so the shared UI uses light surfaces and blue/green accents. Keep the selector structure unchanged. Use a block along these lines at the top of the CSS string:

```js
.qmm{
  --qmm-bg:        #f4fbff;
  --qmm-bg-soft:   #eef8ff;
  --qmm-panel:     rgba(255,255,255,0.94);
  --qmm-panel-2:   rgba(242,250,255,0.96);
  --qmm-border:    rgba(113,165,206,0.30);
  --qmm-border-2:  rgba(140,190,219,0.20);
  --qmm-accent:    #63a9e9;
  --qmm-accent-2:  #7fcf9f;
  --qmm-accent-soft:#dff1ff;
  --qmm-success-soft:#e4f8ea;
  --qmm-text:      #23425d;
  --qmm-text-dim:  #5e7a92;
  --qmm-shadow:    0 18px 38px rgba(102,150,190,.16);
  --qmm-blur:      12px;
  display:flex;
  flex-direction:column;
  gap:12px;
  color:var(--qmm-text);
}
```

Apply the same direction through the rest of the shared CSS:

```js
.qmm-tabs{
  border-bottom:1px solid var(--qmm-border-2);
  background:linear-gradient(180deg, rgba(244,251,255,.98), rgba(232,245,255,.95));
}
.qmm-tab{
  color:var(--qmm-text-dim);
  border:1px solid transparent;
  border-radius:14px;
}
.qmm-tab:hover{
  background:rgba(99,169,233,.10);
  color:var(--qmm-text);
}
.qmm-tab.active{
  background:linear-gradient(180deg, rgba(223,241,255,.96), rgba(228,248,234,.92));
  border-color:rgba(99,169,233,.32);
  color:#1f4d78;
  box-shadow:0 8px 20px rgba(99,169,233,.16);
}
.qmm-views{
  border:1px solid var(--qmm-border);
  background:
    radial-gradient(circle at top right, rgba(127,207,159,.15), transparent 28%),
    linear-gradient(180deg, rgba(255,255,255,.96), rgba(244,251,255,.94));
  box-shadow:var(--qmm-shadow);
}
.qmm-btn{
  border:1px solid var(--qmm-border);
  background:linear-gradient(180deg, rgba(255,255,255,.96), rgba(233,245,255,.92));
  color:var(--qmm-text);
  border-radius:12px;
}
.qmm-btn--primary,
.qmm-btn.qmm-primary{
  background:linear-gradient(180deg, rgba(118,181,236,.95), rgba(99,169,233,.88));
  border-color:rgba(72,138,197,.55);
  color:#ffffff;
}
.qmm-btn--secondary{
  background:linear-gradient(180deg, rgba(237,249,255,.95), rgba(227,245,238,.92));
}
.qmm-btn.active{
  background:linear-gradient(180deg, rgba(228,248,234,.96), rgba(223,241,255,.92));
  border-color:rgba(127,207,159,.45);
}
.qmm-card{
  border:1px solid var(--qmm-border);
  border-radius:16px;
  background:linear-gradient(180deg, rgba(255,255,255,.97), rgba(241,249,255,.95));
  box-shadow:0 14px 28px rgba(102,150,190,.12);
}
.qmm-input{
  background:rgba(255,255,255,.95);
  color:var(--qmm-text);
  border:1px solid rgba(127,171,205,.34);
}
.qmm-input:focus{
  border-color:var(--qmm-accent);
  background:#ffffff;
  box-shadow:0 0 0 3px rgba(99,169,233,.18);
}
```

Continue this palette shift through tables, chips, segmented controls, sliders, hotkeys, empty states, and error bars while preserving current class names and interaction states.

- [ ] **Step 4: Run shared-theme verification**

Run: `rg -n --fixed-strings -- "--qmm-bg:        #f4fbff;" quinoa-ws.min.user.js`

Expected: one match inside `Menu.ensureStyles()`.

Run: `node --check quinoa-ws.min.user.js`

Expected: no output and exit status `0`.

- [ ] **Step 5: Commit**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: restyle shared qmm ui with pastel blue-green theme"
```

### Task 2: Add reusable inline SVG icons to shared controls

**Files:**
- Modify: `quinoa-ws.min.user.js` around `Menu.btn()`, `Menu.card()`, and `Menu.toggleChip()`
- Modify: `quinoa-ws.min.user.js` near the shared UI helper region before `var Menu = class {`

- [ ] **Step 1: Write the failing icon-helper check**

```bash
rg -n "function createSvgIcon|const ICON_SVGS" quinoa-ws.min.user.js
```

Expected: no matches.

- [ ] **Step 2: Run the icon-helper check**

Run: `rg -n "function createSvgIcon|const ICON_SVGS" quinoa-ws.min.user.js`

Expected: exit status `1` with no output.

- [ ] **Step 3: Add the SVG icon registry and wire it into shared UI helpers**

Insert a helper before `var Menu = class {` so shared controls can accept semantic icon names:

```js
  const ICON_SVGS = {
    confirm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7.8"/></svg>',
    clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    remove: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg>',
    open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5"/><path d="M10 14 19 5"/><path d="M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 6 10 6-10 6z"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3"/><path d="M12 18v3"/><path d="m4.93 4.93 2.12 2.12"/><path d="m16.95 16.95 2.12 2.12"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="m4.93 19.07 2.12-2.12"/><path d="m16.95 7.05 2.12-2.12"/><circle cx="12" cy="12" r="3"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><circle cx="5" cy="6" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="18" r="1"/></svg>'
  };
  function createSvgIcon(name, labelText = "") {
    const key = String(name || "").trim().toLowerCase();
    const markup = ICON_SVGS[key];
    if (!markup) return null;
    const span = document.createElement("span");
    span.className = "qmm-svg-icon";
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = markup;
    if (labelText) span.dataset.iconFor = labelText;
    return span;
  }
```

Update the shared button/card/chip icon handling to prefer semantic icon names while preserving compatibility:

```js
      if (opts.icon) {
        iconEl = typeof opts.icon === "string"
          ? createSvgIcon(opts.icon, trimmedLabel) || document.createElement("span")
          : opts.icon;
        if (typeof opts.icon === "string" && iconEl && !iconEl.firstChild) {
          iconEl.textContent = opts.icon;
        }
        if (iconEl) {
          iconEl.classList.add("qmm-btn__icon");
        }
      }
```

Apply the same `createSvgIcon(...) || fallback span` pattern in `Menu.card()` and `Menu.toggleChip()`. Add CSS in `Menu.ensureStyles()` for icon sizing and stroke rendering:

```js
.qmm-svg-icon{
  display:inline-flex;
  width:1rem;
  height:1rem;
  flex:0 0 auto;
}
.qmm-svg-icon svg{
  width:100%;
  height:100%;
  fill:none;
  stroke:currentColor;
  stroke-width:1.9;
  stroke-linecap:round;
  stroke-linejoin:round;
  overflow:visible;
}
```

- [ ] **Step 4: Verify helper presence and syntax**

Run: `rg -n "function createSvgIcon|const ICON_SVGS|\\.qmm-svg-icon" quinoa-ws.min.user.js`

Expected: matches for the new registry, helper, and CSS rules.

Run: `node --check quinoa-ws.min.user.js`

Expected: no output and exit status `0`.

- [ ] **Step 5: Commit**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: add shared svg icons for bundled ui controls"
```

### Task 3: Polish the seed and decor selection overlays

**Files:**
- Modify: `quinoa-ws.min.user.js` around `styleOverlayBox()`, `createButton()`, `createSeedOverlay()`, `renderListRow()`, `refreshList()`, `createDecorOverlay()`, `renderDecorListRow()`, and `refreshDecorList()`

- [ ] **Step 1: Write the failing overlay-state check**

```bash
rg -n "qws-overlay-box|qws-overlay-empty|qws-overlay-row|qws-overlay-summary" quinoa-ws.min.user.js
```

Expected: no matches.

- [ ] **Step 2: Run the overlay-state check**

Run: `rg -n "qws-overlay-box|qws-overlay-empty|qws-overlay-row|qws-overlay-summary" quinoa-ws.min.user.js`

Expected: exit status `1` with no output.

- [ ] **Step 3: Convert the seed/decor overlays to the new light visual language**

Update the overlay helpers so these custom panels stop looking like leftover dark tools. Keep the same behavior and element hierarchy, but add reusable classes and lighter inline styles:

```js
  function styleOverlayBox(div, id) {
    div.id = id;
    div.className = "qws-overlay-box";
    setStyles(div, {
      position: "fixed",
      left: "12px",
      top: "12px",
      zIndex: "999999",
      display: "grid",
      gridTemplateRows: "auto auto 1px 1fr auto",
      gap: "8px",
      minWidth: "340px",
      maxWidth: "440px",
      maxHeight: "52vh",
      padding: "12px",
      border: "1px solid rgba(113,165,206,0.30)",
      borderRadius: "18px",
      background: "linear-gradient(180deg, rgba(255,255,255,.97), rgba(240,249,255,.95))",
      boxShadow: "0 18px 36px rgba(102,150,190,.18)",
      backdropFilter: "blur(8px)",
      userSelect: "none",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      fontSize: "12px",
      lineHeight: "1.35",
      color: "#23425d"
    });
    div.dataset["qwsSeedDeleter"] = "1";
  }
```

Update the local helper button to align with the shared pastel buttons and expose semantic variants:

```js
  function createButton(label2, styleOverride) {
    const b = document.createElement("button");
    b.textContent = label2;
    b.className = "qws-overlay-btn";
    setStyles(b, {
      padding: "7px 12px",
      borderRadius: "12px",
      border: "1px solid rgba(113,165,206,0.30)",
      background: "linear-gradient(180deg, rgba(255,255,255,.98), rgba(229,243,255,.92))",
      color: "#23425d",
      cursor: "pointer",
      fontWeight: "700",
      fontSize: "12px",
      ...styleOverride
    });
    b.onmouseenter = () => b.style.borderColor = "rgba(99,169,233,0.55)";
    b.onmouseleave = () => b.style.borderColor = "rgba(113,165,206,0.30)";
    return b;
  }
```

Apply the new surface language in both overlays:

```js
    setStyles(list, {
      minHeight: "52px",
      maxHeight: "26vh",
      overflow: "auto",
      padding: "6px",
      border: "1px dashed rgba(127,171,205,.45)",
      borderRadius: "14px",
      background: "rgba(247,252,255,.92)",
      userSelect: "text"
    });
```

For each row, add softer spacing and row surfaces:

```js
    row.className = "qws-overlay-row";
    setStyles(row, {
      display: "grid",
      gridTemplateColumns: "1fr auto",
      alignItems: "center",
      gap: "8px",
      padding: "8px 10px",
      borderRadius: "12px",
      borderBottom: "none",
      background: "rgba(255,255,255,.82)"
    });
```

For empty states, turn the plain text blocks into intentional placeholders:

```js
      const empty = document.createElement("div");
      empty.className = "qws-overlay-empty";
      empty.textContent = "Chưa chọn hạt giống.";
      setStyles(empty, {
        padding: "14px 12px",
        borderRadius: "12px",
        textAlign: "center",
        color: "#5e7a92",
        background: "rgba(239,248,255,.86)"
      });
```

Repeat the same treatment for decor overlay creation, rows, quantity inputs, summary text, and the disabled confirm state. Keep the existing event handlers and data flow unchanged.

- [ ] **Step 4: Verify overlay markers and syntax**

Run: `rg -n "qws-overlay-box|qws-overlay-empty|qws-overlay-row|qws-overlay-summary|qws-overlay-btn" quinoa-ws.min.user.js`

Expected: matches in the seed/decor overlay helper region.

Run: `node --check quinoa-ws.min.user.js`

Expected: no output and exit status `0`.

- [ ] **Step 5: Commit**

```bash
git add quinoa-ws.min.user.js
git commit -m "feat: polish seed and decor selection overlays"
```

### Task 4: Final regression pass across touched UI states

**Files:**
- Modify: `quinoa-ws.min.user.js` only if a regression is found during verification

- [ ] **Step 1: Run a final shared verification sweep**

Run:

```bash
rg -n --fixed-strings -- "--qmm-bg:        #f4fbff;" quinoa-ws.min.user.js
rg -n "function createSvgIcon|const ICON_SVGS|\\.qmm-svg-icon" quinoa-ws.min.user.js
rg -n "qws-overlay-box|qws-overlay-empty|qws-overlay-row|qws-overlay-summary|qws-overlay-btn" quinoa-ws.min.user.js
node --check quinoa-ws.min.user.js
```

Expected: all `rg` commands return matches and `node --check` exits `0`.

- [ ] **Step 2: Review the touched interaction paths manually in code**

Inspect:

```bash
sed -n '13219,13780p' quinoa-ws.min.user.js
sed -n '14542,15120p' quinoa-ws.min.user.js
sed -n '15600,16540p' quinoa-ws.min.user.js
```

Expected: icon helper call sites still preserve the string fallback path, and seed/decor overlay handlers still call the same selection and patch functions.

- [ ] **Step 3: Make any narrow fixups required by the verification pass**

If a regression appears, limit the fix to the affected selector or helper. Example:

```js
      if (typeof opts.icon === "string" && iconEl && !iconEl.firstChild) {
        iconEl.textContent = opts.icon;
      }
```

Use the same narrow-fix approach for any disabled-button style, focus ring, or overlay spacing issue discovered in review.

- [ ] **Step 4: Re-run syntax verification after any fix**

Run: `node --check quinoa-ws.min.user.js`

Expected: no output and exit status `0`.

- [ ] **Step 5: Commit final fixes if needed**

```bash
git add quinoa-ws.min.user.js
git commit -m "fix: finalize pastel ui regression cleanup"
```

## Self-Review

- Spec coverage:
  Shared `qmm-*` redesign is covered by Task 1.
  Shared SVG icon helper is covered by Task 2.
  Seed/decor overlay polish and custom one-off surfaces are covered by Task 3.
  Final syntax and interaction regression checks are covered by Task 4.
- Placeholder scan:
  No `TODO`, `TBD`, or undefined "write tests later" steps remain.
- Type consistency:
  `ICON_SVGS`, `createSvgIcon`, `qws-overlay-box`, `qws-overlay-empty`, `qws-overlay-row`, and `qws-overlay-btn` are defined once and reused consistently in later tasks.
