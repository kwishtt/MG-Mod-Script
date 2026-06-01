# Stock Buyer Design

## Goal

Add a separate HUD menu named `Stock Buyer` that can buy configured shop items in the background. If auto-buy was enabled before a tab reload, the controller restores its saved configuration and resumes without requiring the user to open the menu.

## User Semantics

`quantity` means "buy up to this many items per scan/restock while stock exists." It is not an owned-inventory target.

Example: `Carrot Seed x3` attempts to buy up to three Carrot Seed items during each eligible scan. If only one remains in stock, it buys one. On the next restock/scan, it may buy up to three again.

## Storage

Use the existing Aries storage helpers (`readAriesPath` and `writeAriesPath`) under these paths:

- `stockBuyer.enabled`
- `stockBuyer.intervalSec`
- `stockBuyer.rules.seed`
- `stockBuyer.rules.egg`
- `stockBuyer.rules.tool`
- `stockBuyer.rules.decor`
- `stockBuyer.stats`

Each rule stores:

- `itemId`: raw shop item id, such as species, eggId, toolId, or decorId
- `qty`: positive integer, clamped to a practical UI maximum
- `enabled`: whether this shop block should auto-buy

Stats store:

- `totalItems`
- `totalCoins`
- `byKind.seed`
- `byKind.egg`
- `byKind.tool`
- `byKind.decor`
- `history`: newest/oldest compact entries capped at 80

## Architecture

Implement a small `StockBuyerService` near the existing shop services, using `NotifierService.onShopsChangeNow` and `NotifierService.onPurchasesChangeNow` for current shop and purchase snapshots. This allows stock calculation without opening any shop modal.

The controller starts from main via `startStockBuyerController()`. It schedules scans with `setTimeout`, reads stored config on each schedule, and resumes after reload if global `enabled` is true or any rule `enabled` is true.

## Buy Flow

For each enabled rule:

1. Resolve the selected item from the current shop snapshot.
2. Compute remaining stock as `initialStock - purchasedCount`.
3. Check `Atoms.inventory.isMyInventoryAtMaxLength` before purchase attempts.
4. Buy up to `min(rule.qty, remainingStock)`.
5. After each successful buy, increment stats and append one compact history entry for the batch.
6. If no stock is available, update short status only. Do not append repeated no-stock log entries.

Manual `Buy now` uses the same purchase function but ignores the rule's auto toggle.

## Price Handling

Use catalog coin prices where available:

- seed: `plantCatalog2[species].seed.coinPrice`
- egg: `petEggCatalog2[eggId].coinPrice`
- tool: `toolCatalog2[toolId].coinPrice`
- decor: `decorCatalog2[decorId].coinPrice`

If a price cannot be resolved, count items bought and record `0` additional coins rather than blocking purchase.

## UI

Register a separate HUD item named `Stock Buyer`.

The menu contains:

- Header with global auto-buy switch and scan interval
- Four compact sections: `Seed`, `Egg`, `Tool`, `Decor`
- Each section has item dropdown, quantity input, per-rule auto switch, `Mua ngay` button, and short status
- Compact stats section at the bottom with total items, total coins, by-kind counts, short history capped at 80 lines, and `Xóa thống kê`

The UI should not require opening the game shop modal. Dropdowns are populated from the current shop snapshot and any previously selected item that is no longer visible remains selectable as a preserved option.

## Error Handling

If shop snapshots are unavailable, show `Đang chờ dữ liệu shop`.

If inventory is full, stop the current scan and show/log `Túi đồ đầy` once for that scan.

If a purchase throws, stop the current item's batch, record a short status, and continue to the next shop rule.

## Verification

Because the workspace only contains a built userscript, verification is syntax-focused:

- `node --check quinoa-ws.min.user.js`
- targeted text inspection for registered HUD menu and main startup call

Manual browser verification should confirm reload restores auto-buy from storage.
