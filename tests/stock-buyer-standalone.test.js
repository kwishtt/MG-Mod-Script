const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "tools", "stock-buyer-standalone.user.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(source, /@name\s+MG Stock Buyer Standalone/, "standalone script should have its own userscript name");
assert.match(source, /window\.MGStockBuyerStandalone/, "standalone script should expose a console API");
assert.match(source, /dryRun:\s*true/, "standalone script should default to dry-run mode");
assert.match(source, /type:\s*"PurchaseShopItem"/, "standalone script should use the accepted shop purchase payload");
assert.match(source, /shop:\s*kind/, "standalone script should send the selected shop kind");
assert.match(source, /itemType:\s*meta\.itemType/, "standalone script should include the item type in purchase payloads");
assert.match(source, /MagicCircle_RoomConnection/, "standalone script should send through the room connection");
assert.match(source, /mg-stock-buyer-standalone-config/, "standalone script should persist its own config");
assert.match(source, /attachShadow/, "standalone script should render an isolated panel UI");

console.log("stock buyer standalone smoke checks passed");
