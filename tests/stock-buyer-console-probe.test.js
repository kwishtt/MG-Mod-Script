const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "tools", "stock-buyer-console-probe.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(
  source,
  /window\.MGStockBuyerProbe/,
  "console probe should expose window.MGStockBuyerProbe"
);

assert.match(
  source,
  /dryRun:\s*true/,
  "console probe should default to dryRun mode"
);

for (const type of ["PurchaseSeed", "PurchaseEgg", "PurchaseTool", "PurchaseDecor", "PurchaseShopItem"]) {
  assert.match(source, new RegExp(type), `console probe should include ${type}`);
}

assert.match(
  source,
  /shop:\s*normalizedKind/,
  "console probe should test the current PurchaseShopItem payload shape"
);

assert.match(
  source,
  /__qwsStockBuyer/,
  "console probe should test the Stock Buyer marker payload"
);

assert.match(
  source,
  /method:\s*_method,\s*\.\.\.cleanPayload/,
  "console probe should strip method from live game payloads"
);

assert.match(
  source,
  /ITEM_ID_OR_SPECIES/,
  "console probe should guard against the placeholder item id"
);

assert.match(
  source,
  /MagicCircle_RoomConnection/,
  "console probe should try the page room connection API"
);

assert.match(
  source,
  /runWithSnapshot/,
  "console probe should support before/after REST snapshots"
);

assert.match(
  source,
  /\/me\/credits/,
  "console probe should snapshot credits after live purchase attempts"
);

assert.match(
  source,
  /startRecording/,
  "console probe should record manual purchase messages for comparison"
);

assert.match(
  source,
  /scopePath\s*=\s*\[\s*"Room",\s*"Quinoa"\s*\]/,
  "console probe should include the Room/Quinoa scopePath"
);

console.log("stock buyer console probe smoke checks passed");
