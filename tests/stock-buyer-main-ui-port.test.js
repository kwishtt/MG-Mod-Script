const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "quinoa-ws.min.user.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(source, /STOCK_BUYER_API_BASE\s*=\s*"https:\/\/mg-api\.ariedam\.fr"/, "main StockBuyer should use the Magic Garden API catalog base URL");
assert.match(source, /async\s+function\s+stockBuyerFetchApiCatalog\s*\(/, "main StockBuyer should fetch catalog data from the API");
assert.match(source, /function\s+stockBuyerBuildApiCatalog\s*\(/, "main StockBuyer should build stock catalog entries from API data");
assert.match(source, /stockBuyerApiCatalog/, "main StockBuyer should keep a runtime API catalog cache");
assert.match(source, /sprite:/, "main StockBuyer catalog entries should include sprite URLs");
assert.match(source, /coinPrice/, "main StockBuyer catalog entries should include API coin prices");
assert.match(source, /function\s+stockBuyerRenderThumb\s*\(/, "main StockBuyer UI should render item thumbnails");
assert.match(source, /qmm-stock-buyer-combo/, "main StockBuyer add control should use the rich combobox UI");
assert.match(source, /stockBuyerRenderComboOption/, "main StockBuyer dropdown options should include image, stock, and coin data");
assert.match(source, /stockBuyerRenderComboSelected/, "main StockBuyer selected item should show image and price");
assert.doesNotMatch(source, /<select\s+data-stock-buyer-add-item/, "main StockBuyer UI should not fall back to a native image-less item select");
assert.match(source, /type:\s*"PurchaseShopItem"/, "main StockBuyer should keep the original purchase payload logic");
assert.match(source, /itemType:\s*"Seed"/, "main StockBuyer should keep itemType in the purchase payload");

console.log("stock buyer main UI/API port smoke checks passed");
