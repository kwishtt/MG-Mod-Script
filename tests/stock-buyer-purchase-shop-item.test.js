const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "quinoa-ws.min.user.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(
  source,
  /async\s+function\s+stockBuyerSendBuy\s*\(/,
  "Stock Buyer should have a dedicated buy sender"
);

assert.match(
  source,
  /type:\s*"PurchaseShopItem"/,
  "Stock Buyer should use the currently accepted PurchaseShopItem payload"
);

assert.match(
  source,
  /itemType:\s*"Seed"/,
  "Stock Buyer should include itemType for seed purchases"
);

assert.match(
  source,
  /registerMessageInterceptor\("PurchaseShopItem"/,
  "message hooks should understand PurchaseShopItem purchases"
);

console.log("stock buyer PurchaseShopItem smoke checks passed");
