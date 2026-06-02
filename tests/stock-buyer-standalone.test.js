const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "tools", "stock-buyer-kwishtt.user.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(source, /@name\s+.*Stock Buyer/, "standalone script should have its own userscript name");
assert.match(source, /window\.MGStockBuyerStandalone/, "standalone script should expose a console API");
assert.doesNotMatch(source, /dryRun/, "standalone script should not expose dry-run mode");
assert.match(source, /type:\s*"PurchaseShopItem"/, "standalone script should use the accepted shop purchase payload");
assert.match(source, /shop:\s*kind/, "standalone script should send the selected shop kind");
assert.match(source, /itemType:\s*meta\.itemType/, "standalone script should include the item type in purchase payloads");
assert.match(source, /MagicCircle_RoomConnection/, "standalone script should send through the room connection");
assert.match(source, /currentWebSocket/, "standalone script should fall back to the current room websocket");
assert.match(source, /prototype\.sendMessage/, "standalone script should support prototype sendMessage");
assert.match(source, /QWS_Atoms/, "standalone script should read exposed game atoms for stock confirmation");
assert.match(source, /jotaiAtomCache/, "standalone script should discover game atoms when QWS_Atoms is not already exposed");
assert.match(source, /function\s+ensureJotaiStore\s*\(/, "standalone script should capture the live Jotai store like the original");
assert.match(source, /function\s+createCapturedAtoms\s*\(/, "standalone script should build the Stock Buyer atom subset itself");
assert.match(source, /makeCapturedAtom\s*\(\s*"shopsAtom"\s*\)/, "standalone script should create a shops atom wrapper");
assert.match(source, /makeCapturedAtom\s*\(\s*"myInventoryAtom"\s*\)/, "standalone script should create an inventory atom wrapper");
assert.match(source, /makeCapturedAtom\s*\(\s*"mySeedInventoryAtom"\s*\)/, "standalone script should create a seed inventory atom wrapper");
assert.match(source, /makeCapturedAtom\s*\(\s*"positionAtom"\s*\)/, "standalone script should capture position atom for anti-AFK pings");
assert.doesNotMatch(source, /this\.get\(\)/, "captured atom subscriptions should not depend on a dynamic this binding");
assert.match(source, /readShopSnapshot/, "standalone script should read current shop stock before buying");
assert.doesNotMatch(
  source,
  /await\s+waitForPurchaseConfirmation\(/,
  "standalone buy flow should use the original stock-then-inventory confirmation flow"
);
assert.doesNotMatch(
  source,
  /const\s+confirmed\s*=\s*await\s+waitPurchaseCountAbove/,
  "standalone buy flow should not rely only on shop purchase counters for confirmation"
);
assert.match(source, /function\s+getInventoryItems\s*\(/, "standalone script should parse inventory containers like the original");
assert.match(source, /async\s+function\s+waitRemainingBelow\s*\(/, "standalone script should wait for shop stock to decrease like the original");
assert.match(source, /async\s+function\s+waitInventoryCountAbove\s*\(/, "standalone script should wait for inventory to increase like the original");
assert.match(
  source,
  /const\s+confirmedRemaining\s*=\s*await\s+waitRemainingBelow\(/,
  "standalone buy flow should confirm stock decrease before counting a purchase"
);
assert.match(
  source,
  /const\s+confirmedInventory\s*=\s*await\s+waitInventoryCountAbove\(/,
  "standalone buy flow should confirm inventory increase before counting a purchase"
);
assert.match(
  source,
  /Math\.min\s*\(\s*currentRemaining\s*-\s*confirmedRemaining\s*,\s*confirmedInventory\s*-\s*currentInventory\s*\)/,
  "standalone buy flow should compute bought quantity the same way as the original"
);
assert.match(source, /Lỗi lấy dữ liệu shop/, "standalone script should warn instead of buying when stock cannot be confirmed");
assert.match(source, /rememberShopSnapshot/, "standalone script should cache the latest readable shop snapshot");
assert.match(source, /waitForShopSnapshot/, "standalone script should retry briefly while shop data is not ready");
assert.match(source, /onChange/, "standalone script should subscribe to shop atom updates when possible");
assert.doesNotMatch(source, /sendToGame\(payload\);\s*recordPurchase/, "standalone script should not count a purchase immediately after sending a payload");
assert.match(source, /mg-stock-buyer-standalone-config/, "standalone script should persist its own config");
assert.match(source, /attachShadow/, "standalone script should render an isolated panel UI");
assert.match(source, /made by kwishtt/, "standalone panel should include a subtle author watermark");
assert.match(source, /class="watermark"/, "standalone watermark should use a dedicated low-noise style class");
assert.match(source, /ITEM_CATALOG/, "standalone script should provide item dropdown catalogs");
assert.match(source, /MG_API_BASE\s*=\s*"https:\/\/mg-api\.ariedam\.fr"/, "standalone script should use the Magic Garden API base URL");
assert.match(source, /async\s+function\s+fetchApiCatalog\s*\(/, "standalone script should fetch item catalog data from the API");
assert.match(source, /buildApiCatalog/, "standalone script should build stock buyer catalog entries from API data");
assert.match(source, /apiCatalog/, "standalone script should keep a runtime API catalog cache");
assert.match(source, /sprite:/, "standalone catalog entries should include sprite URLs");
assert.match(source, /coinPrice/, "standalone catalog entries should include API coin prices");
assert.match(source, /data-selected-preview/, "standalone UI should show a selected item preview with image and price");
assert.match(source, /class="thumb"/, "standalone item rows should show item thumbnails");
assert.match(source, /data-add-item/, "standalone script should use an item dropdown for adding purchases");
assert.match(source, /data-combobox/, "standalone add-item control should use a compact custom combobox");
assert.match(source, /class="combo-menu"/, "standalone custom dropdown should render a bounded scroll menu");
assert.match(source, /class="combo-option"/, "standalone custom dropdown should render rich item option rows");
assert.match(source, /renderComboOption/, "standalone custom dropdown options should include item image and coin data");
assert.match(source, /data-selected-item/, "standalone custom dropdown should keep the selected item in a stable hidden value");
assert.doesNotMatch(source, /<select\s+data-add-item/, "standalone custom dropdown should not use native select for item images");
assert.doesNotMatch(source, /data-add-id/, "standalone script should not use free-form item id input in the UI");
assert.match(source, /backdrop-filter:\s*blur/, "standalone UI should use a translucent glass style");
assert.match(source, /rgba\(255,\s*255,\s*255/, "standalone UI should use a translucent palette");
assert.match(source, /stats:/, "standalone script should track purchase stats");
assert.match(source, /totalSent/, "standalone stats should include total sent purchases");
assert.match(source, /totalSpent/, "standalone stats should include money spent");
assert.match(source, /byItem/, "standalone stats should track purchases by registered item");
assert.match(source, /intervalSec:\s*300/, "standalone script should default to 300 seconds between auto runs");
assert.match(source, /maxPerItem:\s*3/, "standalone script should default to buying 3 per item per run");
assert.match(source, /MAX_PER_ITEM_STEPS\s*=\s*\[\s*1,\s*3,\s*5,\s*10,\s*20,\s*"stock"\s*\]/, "standalone script should expose fixed max-buy slider steps");
assert.match(source, /MAX_PER_ITEM_LABELS\s*=\s*\[\s*"1",\s*"3",\s*"5",\s*"10",\s*"20",\s*"Max Stock"\s*\]/, "standalone script should label the Max Stock slider option");
assert.match(source, /normalizeMaxPerItem/, "standalone script should normalize numeric and Max Stock max-buy settings");
assert.match(source, /resolveMaxBuyCount/, "standalone script should resolve Max Stock to the currently available shop stock");
assert.match(source, /data-field="maxPerItemSlider"/, "standalone UI should use a slider for max-buy mode");
assert.match(source, /class="row range-row interval-row"/, "standalone UI should place interval slider on its own row");
assert.match(source, /class="row range-row max-buy-row"/, "standalone UI should place max-buy slider on its own row");
assert.doesNotMatch(source, /data-field="maxPerItem"[^S]/, "standalone UI should not use a free numeric max-buy input");
assert.match(source, /data-action="clear-stats"/, "standalone UI should expose a clear stats action");
assert.match(source, /Registered Stock|Kho Stock Đăng Ký/, "standalone UI should label the registered stock table");
assert.match(source, /Bought|Đã mua/, "standalone UI should show bought count per registered item");
assert.match(source, /data-action="toggle-auto"/, "standalone UI should use a dedicated Auto Mode action");
assert.match(source, /function\s+icon\s*\(/, "standalone UI should render svg icons");
assert.match(source, /<svg/, "standalone UI should include SVG icons");
assert.match(source, /"success"/, "standalone logs should support success severity");
assert.match(source, /"error"/, "standalone logs should support error severity");
assert.match(source, /"warn"/, "standalone logs should support warning severity");
assert.match(source, /function\s+updateLog\s*\(/, "standalone logs should support updating an existing progress entry");
assert.match(source, /progressLog\s*=\s*updateLog\(/, "standalone buy progress should update one log row instead of spamming rows");
assert.match(source, /function\s+createAntiAfkController\s*\(/, "standalone script should include the original anti-AFK controller");
assert.match(source, /STOP_EVENTS\s*=\s*\[\s*"visibilitychange",\s*"blur",\s*"focus",\s*"focusout",\s*"pagehide",\s*"freeze",\s*"resume"\s*\]/, "anti-AFK should swallow the same stop events as the original");
assert.match(source, /Object\.defineProperty\(docProto,\s*"hidden"/, "anti-AFK should force document.hidden to false");
assert.match(source, /Object\.defineProperty\(docProto,\s*"visibilityState"/, "anti-AFK should force visibilityState to visible");
assert.match(source, /document\.hasFocus\s*=\s*\(\)\s*=>\s*true/, "anti-AFK should force document.hasFocus");
assert.match(source, /new\s+\(window\.AudioContext\s*\|\|\s*window\.webkitAudioContext\)/, "anti-AFK should start the same quiet audio keepalive");
assert.match(source, /new MouseEvent\("mousemove"/, "anti-AFK should emit mousemove heartbeat events");
assert.match(source, /type:\s*"PlayerPosition"/, "anti-AFK should ping player position like the original");
assert.match(source, /antiAfk\.start\(\)/, "standalone script should start anti-AFK on startup");
assert.match(source, /log-entry--success/, "standalone logs should style successful purchases");
assert.match(source, /log-entry--error/, "standalone logs should style failed purchases");
assert.match(source, /log-entry--warn/, "standalone logs should style warning stock messages");

console.log("stock buyer standalone smoke checks passed");
