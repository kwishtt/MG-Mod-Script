const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const source = fs.readFileSync("quinoa-ws.min.user.js", "utf8");

function extractFunctionBody(name) {
  const marker = `async function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} should exist`);
  const nextFunction = source.indexOf("\n  async function ", start + marker.length);
  assert.notEqual(nextFunction, -1, `${name} should be followed by another async function`);
  return source.slice(start, nextFunction);
}

test("quick harvest auto-sell option sells once after a completed harvest run", () => {
  const body = extractFunctionBody("automationQuickHarvestCrops");

  assert.ok(
    /if \(completed > 0 && !!opts\.autoSellWhenFull\) \{\s*await automationSellCropsForQuickHarvest\(opts, "phiên thu hoạch hoàn tất", "bán crop xong sau phiên thu hoạch"\);\s*\}/.test(body),
    "completed quick harvest runs should sell crops after finishing when the existing auto-sell option is enabled"
  );
});

test("quick harvest auto-sell label explains both full-inventory and end-of-run selling", () => {
  assert.ok(
    /makeAutomationRow\("Tự bán crop", "Khi túi đầy hoặc sau khi hoàn tất phiên thu hoạch, bán crop trong túi rồi tiếp tục\.", makeControlStack\(quickAutoSell\)\)/.test(source),
    "the UI should describe the expanded auto-sell behavior"
  );
});

test("pet feed blacklist removes blocked crops from inventory feed and farm harvest", () => {
  assert.match(source, /AUTOMATION_FEED_BLACKLIST_PATH = "automation\.petFeed\.blacklistCrops"/);
  assert.match(source, /function automationGetFeedBlacklistSet\(\)/);
  assert.match(source, /automationFindInventoryCrop\(allowedSet, excludeIds = \/\* @__PURE__ \*\/ new Set\(\), blockedSet = \/\* @__PURE__ \*\/ new Set\(\)\)/);
  assert.match(source, /if \(blockedSet\.has\(species\)\) continue;/);
  assert.match(source, /function automationFindHarvestablePlant\(allowedSet, blockedSet = \/\* @__PURE__ \*\/ new Set\(\)\)/);
  assert.match(source, /if \(!species \|\| !allowedSet\.has\(species\) \|\| blockedSet\.has\(species\)\) continue;/);
});

test("pet feed uses round-robin queue instead of filling one pet before the next", () => {
  const body = extractFunctionBody("automationProcessOnce");

  assert.match(body, /const queue = hungry\.map/);
  assert.match(body, /while \(queue\.length\)/);
  assert.match(body, /for \(let i = 0; i < queue\.length;\)/);
  assert.match(body, /await PlayerService\.feedPet\(entry\.petId, crop\.id\)/);
  assert.match(body, /queue\.splice\(i, 1\)/);
  assert.doesNotMatch(body, /return true;\s*\}\s*\}\s*automationSetStatus\("Không có pet nào có thể xử lý"\)/);
});

test("pet feed auto-harvest never uses Gold or Rainbow crops as food", () => {
  const start = source.indexOf("function automationFindHarvestablePlant");
  assert.notEqual(start, -1, "automationFindHarvestablePlant should exist");
  const end = source.indexOf("\n  async function automationWaitForNewCrop", start);
  assert.notEqual(end, -1, "automationFindHarvestablePlant should be followed by automationWaitForNewCrop");
  const body = source.slice(start, end);

  assert.match(body, /automationHasProtectedMutation\(cropSlot, tile\)/);
  assert.match(body, /if \(automationHasProtectedMutation\(cropSlot, tile\)\) continue;/);
});

test("stock buyer preserves registration list scroll during status refreshes", () => {
  assert.match(source, /function stockBuyerListSignature\(snap\)/);
  assert.match(source, /function stockBuyerUpdateListSection\(root, snap\)/);
  assert.match(source, /let lastListSig = "";/);
  assert.match(source, /if \(nextListSig !== lastListSig \|\| !listWrap\.firstElementChild\)/);
  assert.doesNotMatch(source, /\/\/ 4\. Cập nhật List Section\s*listWrap\.replaceChildren\(renderStockBuyerListSection\(ui, snap\)\);/);
});

test("stock buyer registration rows expose a clear delete registration action", () => {
  assert.match(source, /del\.title = "Xóa đăng ký";/);
  assert.match(source, /del\.setAttribute\("aria-label", `Xóa đăng ký \$\{name\.textContent\}`\);/);
});

test("stock buyer API catalog includes all API items instead of filtering by eligible shops", () => {
  const start = source.indexOf("function stockBuyerBuildApiCatalog");
  assert.notEqual(start, -1, "stockBuyerBuildApiCatalog should exist");
  const end = source.indexOf("\n\t  async function stockBuyerFetchJson", start);
  assert.notEqual(end, -1, "stockBuyerBuildApiCatalog should be followed by fetch helper");
  const body = source.slice(start, end);

  assert.doesNotMatch(body, /stockBuyerHasEligibleShop/);
  assert.match(body, /for \(const \[id, item\] of Object\.entries\(items \|\| \{\}\)\) \{/);
  assert.match(body, /stockBuyerAddCatalogEntry\(catalog, \{ kind: "tool"/);
  assert.match(body, /for \(const \[id, decor\] of Object\.entries\(decors \|\| \{\}\)\) \{/);
});

test("stock buyer add UI uses four balanced kind columns with item cards and API images", () => {
  assert.match(source, /\.qmm-stock-buyer-catalog-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(source, /\.qmm-stock-buyer-catalog-card\{/);
  assert.match(source, /function stockBuyerRenderCatalogCard\(entry, snap, existing, onAdd\)/);
  assert.match(source, /stockBuyerRenderThumb\(entry, entry\.name\)/);
  assert.match(source, /card\.dataset\.stockBuyerCatalogCard = stockBuyerCatalogKey\(entry\.kind, entry\.id\);/);
  assert.match(source, /const grouped = Object\.fromEntries\(STOCK_BUYER_KINDS\.map\(\(kind\) => \[kind, stockBuyerCatalogItems\(kind\)\]\)\);/);
  assert.match(source, /const col = document\.createElement\("section"\);\s*col\.className = "qmm-stock-buyer-catalog-column";/);
});
