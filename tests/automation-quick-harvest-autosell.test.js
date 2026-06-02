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
