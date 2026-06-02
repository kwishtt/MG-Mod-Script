const assert = require("assert");
const fs = require("fs");
const path = require("path");

const scriptPath = path.join(__dirname, "..", "quinoa-ws.min.user.js");
const source = fs.readFileSync(scriptPath, "utf8");

assert.match(
  source,
  /AUTOMATION_QUICK_CROPS_PATH\s*=\s*"automation\.quickHarvest\.crops"/,
  "Quick Harvest should persist a multi-crop selection list"
);

assert.match(
  source,
  /function\s+automationGetQuickHarvestCrops\s*\(/,
  "Quick Harvest should resolve selected crops through a dedicated helper"
);

assert.match(
  source,
  /async\s+function\s+automationQuickHarvestCrops\s*\(/,
  "Quick Harvest should harvest multiple selected crops in one run"
);

assert.match(
  source,
  /automationQuickHarvestCrops\(config\.crops,/,
  "scheduled Quick Harvest should use the multi-crop runner"
);

assert.match(
  source,
  /type\s*=\s*"checkbox"/,
  "Quick Harvest UI should render crop checkboxes instead of a single select"
);

console.log("automation quick harvest multi-crop smoke checks passed");
