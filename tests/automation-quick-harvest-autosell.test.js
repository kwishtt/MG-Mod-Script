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

test("quick log is registered inside the main hub without extra controls", () => {
  assert.match(source, /function renderQuickLogMenu\(container\)/);
  assert.match(source, /register\("quick-log", \{ label: "Log", icon: "list" \}, renderQuickLogMenu\);/);
  assert.match(source, /automationOnLog\(\(logs\) => \{/);
  assert.match(source, /stockBuyerSubscribe\(\(snap\) => \{/);
  assert.doesNotMatch(source, /QUICK_LOG_ENABLED_PATH/);
  assert.doesNotMatch(source, /ui\.switch\(automationReadBool\(QUICK_LOG_ENABLED_PATH/);
  assert.doesNotMatch(source, /Bật Log nhanh/);
  assert.doesNotMatch(source, /Khi tắt, Hub không ghi thêm log nhanh/);
  assert.doesNotMatch(source, /startQuickLogOverlay\(\);/);
});

test("quick log reuses stock buyer log UI and lazy-renders newest logs first", () => {
  assert.match(source, /var QUICK_LOG_INITIAL_VISIBLE = 5;/);
  assert.match(source, /logDiv\.className = "qmm-stock-buyer-log";/);
  assert.match(source, /line\.className = `qmm-stock-buyer-log-line qmm-quick-log-line is-\$\{entry\.kind\}`;/);
  assert.match(source, /entries\.unshift\(entry\);/);
  assert.match(source, /quickLogRenderHub\(logDiv, entries, visibleCount\);/);
  assert.match(source, /if \(logDiv\.scrollTop \+ logDiv\.clientHeight >= logDiv\.scrollHeight - 16\) \{/);
  assert.match(source, /visibleCount = Math\.min\(entries\.length, visibleCount \+ QUICK_LOG_BATCH_SIZE\);/);
});

test("quick log text scales down when the hub panel is compact", () => {
  assert.match(source, /function quickLogEnsureHubStyle\(\)/);
  assert.match(source, /\.qmm-quick-log-panel\.is-compact \.qmm-stock-buyer-log\{font-size:11px\}/);
  assert.match(source, /\.qmm-quick-log-panel\.is-tiny \.qmm-stock-buyer-log\{font-size:10px;line-height:1\.35\}/);
  assert.match(source, /const syncTextScale = \(\) => \{/);
  assert.match(source, /panel\.classList\.toggle\("is-compact", compact \|\| tiny\);/);
  assert.match(source, /panel\.classList\.toggle\("is-tiny", tiny\);/);
  assert.match(source, /const observer = new ResizeObserver\(syncTextScale\);/);
});

test("quick log uses transparent compact grid lines and stable wrapping", () => {
  assert.match(source, /\.qws-win\.qws-win--quick-log\{resize:both;overflow:hidden/);
  assert.match(source, /if \(hostWin\) hostWin\.classList\.add\("qws-win--quick-log"\);/);
  assert.match(source, /const panel = document\.createElement\("div"\);\s*panel\.className = "qmm-quick-log-panel";/);
  assert.match(source, /\.qmm-quick-log-panel\{height:100%;min-height:0;display:grid;grid-template-rows:18px minmax\(0,1fr\);gap:2px;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important\}/);
  assert.match(source, /\.qmm-quick-log-panel \.qmm-stock-buyer-log\{height:auto;min-height:0;overflow:auto;display:grid;align-content:start;gap:0;padding:0;border-radius:0;border:0;background:transparent/);
  assert.match(source, /\.qmm-quick-log-panel \.qmm-stock-buyer-log-line\{min-width:0;display:grid;grid-template-columns:72px minmax\(0,1fr\)/);
  assert.match(source, /border-bottom:1px solid rgba\(148,163,184,\.16\)/);
  assert.match(source, /\.qmm-quick-log-panel \.qmm-stock-buyer-log-text\{min-width:0;max-width:100%;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word\}/);
  assert.match(source, /\.qmm-quick-log-panel \.qmm-quick-log-line\.is-automation\{box-shadow:inset 2px 0 0 rgba\(16,185,129,\.55\)\}/);
  assert.doesNotMatch(source, /ui\.card\("Log"/);
});

test("pets menu is rebuilt around fast team switching without feeding tab", () => {
  assert.match(source, /function renderTeamSwitcherTab\(view, ui\)/);
  assert.match(source, /ui\.addTab\("teams", "Teams", \(view\) => renderTeamSwitcherTab\(view, ui\)\);/);
  assert.match(source, /ui\.addTab\("logs", "Logs", \(view\) => renderLogsTab\(view, ui\)\);/);
  assert.doesNotMatch(source, /ui\.addTab\("feeding"/);
});

test("team switcher exposes quick use actions and pet stat summaries", () => {
  assert.match(source, /team-card__use/);
  assert.match(source, /await PetsService\.useTeam\(team\.id\);/);
  assert.match(source, /PetsService\.chooseSlotPet\(team\.id, slotIndex, searchInput\.value\)/);
  assert.match(source, /PetsService\.getHungerPctFor\(activeLike\)/);
  assert.match(source, /getPetStrength\(pet\)/);
  assert.match(source, /getXp\(pet\)/);
  assert.match(source, /PetsService\.getAbilityName\(id\)/);
});

test("pets team switcher uses transparent compact real pet icons with svg fallback", () => {
  const start = source.indexOf("function renderTeamSwitcherTab(view, ui)");
  assert.notEqual(start, -1, "renderTeamSwitcherTab should exist");
  const end = source.indexOf("\n  function renderPetsMenu", start);
  assert.notEqual(end, -1, "renderTeamSwitcherTab should be followed by renderPetsMenu");
  const body = source.slice(start, end);

  assert.match(body, /function renderPetSvgIcon\(pet, size = 28\)/);
  assert.match(body, /function getPetSpriteCandidates\(pet\)/);
  assert.match(body, /function renderPetRealIcon\(host, pet, attempt = 0\)/);
  assert.match(body, /attachSpriteIcon\(host, \["pet"\], candidates, 28, "team-switcher"/);
  assert.match(body, /const service = getSpriteService\(\);/);
  assert.match(body, /setTimeout\(\(\) => renderPetRealIcon\(host, pet, attempt \+ 1\), 160\);/);
  assert.match(body, /onNoSpriteFound: \(\) => \{/);
  assert.match(body, /function teamSvgIcon\(name, size = 16\)/);
  assert.match(body, /team-card__icon-btn/);
  assert.match(body, /\.qws-win\.qws-win--pets \.qmm-views\{[^}]*background:transparent!important/);
  assert.match(body, /\.qmm-pets-teams \.team-card\{[^}]*background:transparent/);
  assert.match(body, /\.qmm-pets-teams \.pet-slot\{[^}]*background:rgba\(15,23,42,\.12\)/);
  assert.doesNotMatch(body, /host\.textContent = "-"|charAt\(0\)|No ability/);
});

test("pet species for team icons is read from nested pet payload shapes", () => {
  assert.match(source, /function _petField\(source, key2\)/);
  assert.match(source, /const speciesRaw = _petField\(x, "petSpecies"\) \?\? _petField\(x, "species"\);/);
  assert.match(source, /const speciesRaw = _petField\(entry, "petSpecies"\) \?\? _petField\(entry, "species"\);/);
  const start = source.indexOf("function renderTeamSwitcherTab(view, ui)");
  const end = source.indexOf("\n  function renderPetsMenu", start);
  const body = source.slice(start, end);
  assert.match(body, /petSpecies: String\(readPetField\(source, "petSpecies"\) \?\? readPetField\(source, "species"\) \?\? ""\)\.trim\(\)/);
  assert.match(body, /name: typeof readPetField\(source, "name"\) === "string" \? readPetField\(source, "name"\) : null/);
});

test("pets menu marks its hub window for transparent styling", () => {
  assert.match(source, /if \(hostWin\) hostWin\.classList\.add\("qws-win--pets"\);/);
});

test("pet team ability data is read from nested game payload shapes", () => {
  assert.match(source, /function _collectStringListFromPetSources\(\.\.\.sources\)/);
  assert.match(source, /_collectStringListFromPetSources\(x, x\.item, x\.data, x\.slot\)/);
  assert.match(source, /_collectStringListFromPetSources\(slot, source, source\.item, source\.data\)/);
  assert.match(source, /_collectStringListFromPetSources\(entry, entry\.slot, entry\.item, entry\.data\)/);
  assert.match(source, /for \(const key2 of \["abilities", "abilityIds", "abilityIDs", "petAbilities"\]\)/);
  assert.match(source, /const nested = value\.abilityId \?\? value\.id \?\? value\.name;/);
});
