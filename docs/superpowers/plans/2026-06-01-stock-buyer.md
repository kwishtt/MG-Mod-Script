# Stock Buyer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reload-resilient Stock Buyer HUD menu that auto-buys selected Seed, Egg, Tool, and Decor items in the background.

**Architecture:** Add a focused stock buyer controller and menu directly inside `quinoa-ws.min.user.js`, following the existing Automation and Notifier patterns. The controller reads/writes `stockBuyer.*` paths, subscribes to shop/purchase snapshots through `NotifierService`, and schedules background scans independent of whether the menu is open.

**Tech Stack:** Userscript JavaScript, existing HUD `Menu`, existing `readAriesPath/writeAriesPath`, `NotifierService`, `ShopsService`, and game atoms.

---

## File Structure

- Modify `quinoa-ws.min.user.js`: add Stock Buyer service/controller, renderer, HUD registration, and startup call.
- No automated test files exist in this workspace. Use `node --check quinoa-ws.min.user.js` for syntax verification.

### Task 1: Stock Buyer Storage and Helpers

**Files:**
- Modify: `quinoa-ws.min.user.js` before `// src/utils/antiafk.ts`

- [ ] **Step 1: Add constants and normalizers**

Add constants for `stockBuyer.enabled`, `stockBuyer.intervalSec`, `stockBuyer.rules.*`, and `stockBuyer.stats`. Define helpers to clamp interval, clamp quantity, normalize rules, normalize stats, format times, resolve item ids/names, and resolve catalog coin prices.

- [ ] **Step 2: Add storage accessors**

Add `stockBuyerGetConfig()`, `stockBuyerSaveRule(kind, patch)`, `stockBuyerSetEnabled(enabled)`, `stockBuyerSetIntervalSec(value)`, `stockBuyerGetStats()`, `stockBuyerSaveStats(stats)`, `stockBuyerClearStats()`.

- [ ] **Step 3: Verify syntax**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits 0.

### Task 2: Background Controller

**Files:**
- Modify: `quinoa-ws.min.user.js` before the Stock Buyer renderer

- [ ] **Step 1: Add runtime state**

Add a `stockBuyerState` object with `started`, `running`, `timer`, `shops`, `purchases`, `statuses`, `listeners`, and no-stock signature fields.

- [ ] **Step 2: Subscribe to shop data**

Use `NotifierService.onShopsChangeNow` and `NotifierService.onPurchasesChangeNow` in `startStockBuyerController()` so the controller has data immediately after script load.

- [ ] **Step 3: Implement scan scheduling**

Implement `stockBuyerScheduleNext()` and `stockBuyerRefreshSchedule()` with `setTimeout`, using `Math.max(5, intervalSec) * 1000`. If disabled and no rule is enabled, clear the timer and set status to `Đang tắt`.

- [ ] **Step 4: Implement one scan**

Implement `stockBuyerProcessOnce(manualKind = null)` that resolves current rule(s), checks stock remaining from `initialStock - purchasedCount`, checks inventory full, buys up to `qty`, updates stats/history, and updates compact statuses.

- [ ] **Step 5: Verify syntax**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits 0.

### Task 3: HUD Menu UI

**Files:**
- Modify: `quinoa-ws.min.user.js` near `renderAutomationMenu`

- [ ] **Step 1: Add `renderStockBuyerMenu(container)`**

Create a compact `Menu({ id: "stock-buyer", compact: true })`. Render a card with header controls, four shop sections, stats, and history.

- [ ] **Step 2: Wire controls to storage and controller**

Dropdown changes call `stockBuyerSaveRule(kind, { itemId })`; quantity changes call `stockBuyerSaveRule(kind, { qty })`; per-section switches call `stockBuyerSaveRule(kind, { enabled })`; global switch calls `stockBuyerSetEnabled`. All changes refresh the controller schedule.

- [ ] **Step 3: Wire manual buy and stats reset**

`Mua ngay` calls `stockBuyerProcessOnce(kind)`. `Xóa thống kê` calls `stockBuyerClearStats()` and re-renders compact stats.

- [ ] **Step 4: Subscribe UI to controller events**

Use a simple `stockBuyerSubscribe(listener)` callback. Re-render status/stats when statuses or stats change. Add `view.__cleanup__` to unsubscribe.

- [ ] **Step 5: Verify syntax**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits 0.

### Task 4: HUD Registration and Startup

**Files:**
- Modify: `quinoa-ws.min.user.js` in `mountHUD({ onRegister(register) { ... } })` and main startup block

- [ ] **Step 1: Register menu**

Add `register("stock-buyer", { label: "Stock Buyer", icon: "cart" }, renderStockBuyerMenu);` near the Automation menu.

- [ ] **Step 2: Start controller on script load**

Add `startStockBuyerController();` after `startAutomationController();`.

- [ ] **Step 3: Verify syntax and references**

Run: `node --check quinoa-ws.min.user.js`

Expected: command exits 0.

Run: `rg -n "Stock Buyer|startStockBuyerController|stockBuyer" quinoa-ws.min.user.js`

Expected: storage paths, renderer, registration, and startup call are present.

## Self-Review

- Spec coverage: storage, reload startup, four section UI, manual buy, auto scan, stats, compact history, and no-stock non-spam behavior are covered.
- Placeholder scan: no implementation step relies on an unspecified file or external build system.
- Type consistency: plan consistently uses `kind` values `seed`, `egg`, `tool`, `decor` for storage/UI and maps them to `ShopsService` values during purchase.
