// ==UserScript==
// @name         MG: Stock Buyer
// @namespace    Ketamijn
// @version      0.1.6
// @description  Made by kwishtt
// @match        https://1227719606223765687.discordsays.com/*
// @match        https://magiccircle.gg/r/*
// @match        https://magicgarden.gg/r/*
// @match        https://starweaver.org/r/*
// @run-at       document-start
// @inject-into  page
// @grant        unsafeWindow
// ==/UserScript==

(() => {
  "use strict";

  const pageWin = typeof unsafeWindow !== "undefined" && unsafeWindow ? unsafeWindow : window;
  const realWin = (() => {
    try {
      if (typeof unsafeWindow !== "undefined" && unsafeWindow) {
        if (typeof unsafeWindow.eval === "function") {
          return unsafeWindow.eval("window");
        }
        return unsafeWindow;
      }
    } catch {}
    return window;
  })();
  const root = pageWin;
  const STORAGE_KEY = "mg-stock-buyer-standalone-config";
  const LEGACY_STORAGE_KEYS = ["mg-stock-buyer-standưalone-config"];
  const LOG_PREFIX = "[MGStockBuyerStandalone]";
  const SCOPE_PATH = ["Room", "Quinoa"];
  const VERSION = "0.1.6";
  const NativeWebSocket = realWin.WebSocket || pageWin.WebSocket;
  const trackedWebSockets = [];

  const KIND_META = {
    seed: { label: "Seed", itemType: "Seed", field: "species" },
    egg: { label: "Egg", itemType: "Egg", field: "eggId" },
    tool: { label: "Tool", itemType: "Tool", field: "toolId" },
    decor: { label: "Decor", itemType: "Decor", field: "decorId" }
  };

  const ITEM_CATALOG = {
    seed: [
      "Carrot", "Cabbage", "Strawberry", "Aloe", "Beet", "Rose", "FavaBean", "Delphinium", "Blueberry", "Apple", "OrangeTulip", "Tomato", "Daffodil", "Corn", "Watermelon", "Pumpkin", "Echeveria", "Pear", "Gentian", "Coconut", "PineTree", "Banana", "Lily", "Camellia", "Squash", "Peach", "BurrosTail", "Mushroom", "Cactus", "Bamboo", "Poinsettia", "VioletCort", "Chrysanthemum", "Date", "Grape", "Pepper", "Lemon", "PassionFruit", "DragonFruit", "Cacao", "Lychee", "Sunflower", "Starweaver", "DawnCelestial", "MoonCelestial", "Gold", "Rainbow", "Wet", "Chilled", "Frozen", "Thunderstruck", "Dawnlit", "Amberlit", "Dawncharged", "Ambercharged"
    ],
    egg: ["CommonEgg", "UncommonEgg", "RareEgg", "LegendaryEgg", "MythicalEgg", "WinterEgg", "SnowEgg", "HorseEgg"],
    tool: ["WateringCan", "PlanterPot", "Shovel", "RainbowPotion", "CropCleanser"],
    decor: [
      "SmallRock", "MediumRock", "LargeRock", "WoodCaribou", "WoodBench", "WoodArch", "WoodBridge", "WoodLampPost", "WoodOwl", "WoodBirdhouse", "WoodWindmill", "WoodPergola", "StoneCaribou", "StoneBench", "StoneArch", "StoneBridge", "StoneLampPost", "StoneGnome", "StoneBirdbath", "MarbleCaribou", "MarbleBench", "MarbleArch", "MarbleBridge", "MarbleLampPost", "MarbleBlobling", "MarbleFountain", "MiniFairyCottage", "Cauldron", "StrawScarecrow", "MiniFairyForge", "MiniFairyKeep", "PetHutch", "FeedingTrough", "DecorShed", "SeedSilo", "MiniWizardTower", "HayBale", "StringLights", "ColoredStringLights", "PaperLantern", "FanousLantern", "SmallGravestone", "MediumGravestone", "LargeGravestone", "Rain", "Frost", "Sunny", "AmberMoon", "Dawn", "Thunderstorm"
    ]
  };

  const PRICE_CATALOG = {
    "seed:Carrot": 10, "seed:Cabbage": 30, "seed:Strawberry": 50, "seed:Aloe": 400, "seed:Blueberry": 2e3,
    "seed:Apple": 5e3, "seed:Tomato": 8e3, "seed:Corn": 1.5e4, "seed:Watermelon": 3e4, "seed:Pumpkin": 5e4,
    "seed:Coconut": 1e5, "seed:Banana": 2e5, "seed:Cactus": 5e5, "egg:CommonEgg": 1e5, "egg:UncommonEgg": 1e6,
    "egg:RareEgg": 1e7, "egg:LegendaryEgg": 1e8, "egg:MythicalEgg": 1e9, "egg:WinterEgg": 8e8, "egg:SnowEgg": 2e8,
    "egg:HorseEgg": 2e8, "tool:WateringCan": 5e3, "tool:PlanterPot": 25e3, "tool:Shovel": 1e6, "tool:CropCleanser": 8e4,
    "decor:SmallRock": 1e3, "decor:MediumRock": 2500, "decor:LargeRock": 5e3, "decor:WoodCaribou": 9e3
  };

  const INTERVAL_STEPS = [5, 60, 180, 300, 600];
  const INTERVAL_LABELS = ["5s", "1m", "3m", "5m", "10m"];

  const DEFAULT_CONFIG = {
    enabled: false, intervalSec: 300, maxPerItem: 3, delayMs: 450, minimized: false,
    stats: { totalSent: 0, totalSpent: 0, byKind: { seed: 0, egg: 0, tool: 0, decor: 0 }, byItem: {} },
    items: []
  };

  const state = {
    config: loadConfig(), timer: null, running: false, lastStatus: "Đang chờ...", logs: [],
    shops: null, purchases: null, shopWatchStarted: false, shopUnsubs: []
  };

  installWebSocketTracker();

  function log(...args) { console.log(LOG_PREFIX, ...args); }

  function rememberWebSocket(ws) {
    if (!ws || trackedWebSockets.includes(ws)) return ws;
    trackedWebSockets.push(ws);
    installIncomingCapture(ws);
    while (trackedWebSockets.length > 12) trackedWebSockets.shift();
    return ws;
  }

  function parseMaybeJson(value) {
    if (typeof value !== "string") return null;
    try { return JSON.parse(value); } catch { return null; }
  }

  function scanForShopData(value, depth = 0, seen = new Set()) {
    if (!value || typeof value !== "object" || depth > 7 || seen.has(value)) return;
    seen.add(value);
    rememberShopSnapshot(value);
    if (value.shopPurchases) rememberPurchaseSnapshot(value.shopPurchases);
    if (value.shops) rememberShopSnapshot(value.shops);
    if (value.child?.data?.shops) rememberShopSnapshot(value.child.data.shops);
    if (value.data?.shops) rememberShopSnapshot(value.data.shops);
    if (value.data?.shopPurchases) rememberPurchaseSnapshot(value.data.shopPurchases);
    if (value.myData?.shopPurchases) rememberPurchaseSnapshot(value.myData.shopPurchases);
    if (Array.isArray(value)) {
      for (const item of value) scanForShopData(item, depth + 1, seen);
      return;
    }
    for (const key of Object.keys(value)) {
      scanForShopData(value[key], depth + 1, seen);
    }
  }

  function captureServerMessage(data) {
    const parsed = parseMaybeJson(data);
    if (parsed) scanForShopData(parsed);
  }

  function installIncomingCapture(ws) {
    if (!ws || ws.__mgStockBuyerIncomingCapture) return;
    try {
      Object.defineProperty(ws, "__mgStockBuyerIncomingCapture", { value: true });
      ws.addEventListener?.("message", (event) => captureServerMessage(event?.data));
    } catch {}
  }

  function installWebSocketTracker() {
    if (typeof NativeWebSocket !== "function") return;
    if (root.WebSocket?.__mgStockBuyerWrapped) return;
    function WrappedWebSocket(...args) { return rememberWebSocket(new NativeWebSocket(...args)); }
    try {
      Object.setPrototypeOf(WrappedWebSocket, NativeWebSocket);
      WrappedWebSocket.prototype = NativeWebSocket.prototype;
      Object.defineProperty(WrappedWebSocket, "__mgStockBuyerWrapped", { value: true });
      Object.defineProperty(WrappedWebSocket, "__mgStockBuyerNative", { value: NativeWebSocket });
      root.WebSocket = WrappedWebSocket;
    } catch (error) {
      console.warn(LOG_PREFIX, "cannot install websocket tracker", error);
    }
  }

  function clampInt(value, fallback, min, max) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
  }

  function normalizeKind(kind) {
    const raw = String(kind || "").toLowerCase().trim();
    if (raw === "seeds" || raw === "plant" || raw === "plants") return "seed";
    if (raw === "eggs") return "egg";
    if (raw === "tools") return "tool";
    if (raw === "decor" || raw === "decors" || raw === "decoration") return "decor";
    return KIND_META[raw] ? raw : "";
  }

  function normalizeItem(raw) {
    const kind = normalizeKind(raw?.kind);
    const id = String(raw?.id ?? raw?.itemId ?? "").trim();
    if (!kind || !id) return null;
    return { kind, id };
  }

  function defaultStats() { return clone(DEFAULT_CONFIG.stats); }

  function normalizeStats(raw) {
    const base = raw && typeof raw === "object" ? raw : {};
    const byKindRaw = base.byKind && typeof base.byKind === "object" ? base.byKind : {};
    const byItemRaw = base.byItem && typeof base.byItem === "object" ? base.byItem : {};
    const byItem = {};
    for (const [key, value] of Object.entries(byItemRaw)) {
      const n = clampInt(value, 0, 0, Number.MAX_SAFE_INTEGER);
      if (n > 0) byItem[key] = n;
    }
    return {
      totalSent: clampInt(base.totalSent, 0, 0, Number.MAX_SAFE_INTEGER),
      totalSpent: clampInt(base.totalSpent, 0, 0, Number.MAX_SAFE_INTEGER),
      byKind: {
        seed: clampInt(byKindRaw.seed, 0, 0, Number.MAX_SAFE_INTEGER),
        egg: clampInt(byKindRaw.egg, 0, 0, Number.MAX_SAFE_INTEGER),
        tool: clampInt(byKindRaw.tool, 0, 0, Number.MAX_SAFE_INTEGER),
        decor: clampInt(byKindRaw.decor, 0, 0, Number.MAX_SAFE_INTEGER)
      },
      byItem
    };
  }

  function normalizeConfig(raw) {
    const base = { ...DEFAULT_CONFIG, ...(raw && typeof raw === "object" ? raw : {}) };
    const seen = new Set();
    const items = [];
    for (const entry of Array.isArray(base.items) ? base.items : []) {
      const item = normalizeItem(entry);
      if (!item) continue;
      const key = `${item.kind}:${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return {
      enabled: !!base.enabled,
      intervalSec: clampInt(base.intervalSec, DEFAULT_CONFIG.intervalSec, 5, 3600),
      maxPerItem: clampInt(base.maxPerItem, DEFAULT_CONFIG.maxPerItem, 1, 50),
      delayMs: clampInt(base.delayMs, DEFAULT_CONFIG.delayMs, 100, 10000),
      minimized: !!base.minimized,
      stats: normalizeStats(base.stats),
      items
    };
  }

  function loadConfig() {
    try {
      const raw = pageWin.localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map((key) => pageWin.localStorage.getItem(key)).find(Boolean) || "null";
      return normalizeConfig(JSON.parse(raw));
    } catch {
      return normalizeConfig(null);
    }
  }

  function saveConfig() {
    state.config = normalizeConfig(state.config);
    pageWin.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    for (const key of LEGACY_STORAGE_KEYS) pageWin.localStorage.removeItem(key);
    render();
    schedule();
    return clone(state.config);
  }

  function getRoomConnection() {
    return pageWin.MagicCircle_RoomConnection || pageWin.top?.MagicCircle_RoomConnection || null;
  }

  function getSocketCandidates(conn) {
    const sockets = [
      conn?.currentWebSocket, conn?.socket, conn?.ws, pageWin.quinoaWS, pageWin.__quinoaWS, ...trackedWebSockets.slice().reverse()
    ];
    return sockets.filter(Boolean);
  }

  function isOpenSocket(socket) {
    const open = (NativeWebSocket && NativeWebSocket.OPEN) || 1;
    return socket && socket.readyState === open && typeof socket.send === "function";
  }

  function resolveRoomSender() {
    const conn = getRoomConnection();
    if (conn && typeof conn.sendMessage === "function") {
      return { method: "sendMessage", send: (payload) => conn.sendMessage(payload) };
    }
    if (conn?.prototype && typeof conn.prototype.sendMessage === "function") {
      return { method: "prototype.sendMessage", send: (payload) => conn.prototype.sendMessage.call(conn, payload) };
    }
    const socket = getSocketCandidates(conn).find(isOpenSocket);
    if (socket) {
      return { method: "currentWebSocket", send: (payload) => socket.send(JSON.stringify(payload)) };
    }
    return null;
  }

  function getAtoms() {
    const candidates = [pageWin.QWS_Atoms, pageWin.Atoms, globalThis.QWS_Atoms, globalThis.Atoms];
    try {
      if (pageWin.top && pageWin.top !== pageWin) candidates.push(pageWin.top.QWS_Atoms, pageWin.top.Atoms);
    } catch {
      // Cross-origin frames can block pageWin.top; page globals above are enough when available.
    }
    return candidates.find(Boolean) || null;
  }

  async function waitForAtoms(timeoutMs = 15000) {
    const started = Date.now();
    do {
      const atoms = getAtoms();
      if (atoms?.shop) return atoms;
      await sleep(150);
    } while (Date.now() - started < timeoutMs);
    return getAtoms();
  }

  async function readAtom(atom) {
    if (!atom || typeof atom.get !== "function") return null;
    try { return await atom.get(); } catch { return null; }
  }

  function getPath(value, path) {
    let cur = value;
    for (const key of path) {
      if (cur == null) return null;
      cur = cur[key];
    }
    return cur ?? null;
  }

  function hasShopSection(raw) {
    return ["seed", "egg", "tool", "decor"].some((kind) => {
      const section = raw?.[kind];
      return section && typeof section === "object" && (
        Array.isArray(section.inventory) ||
        "secondsUntilRestock" in section ||
        "restockAt" in section
      );
    });
  }

  function coerceShopSnapshot(raw) {
    if (!raw || typeof raw !== "object" || !hasShopSection(raw)) return null;
    const coerceSection = (section) => ({
      inventory: Array.isArray(section?.inventory) ? section.inventory : [],
      secondsUntilRestock: Number(section?.secondsUntilRestock) || 0
    });
    return {
      seed: coerceSection(raw.seed), egg: coerceSection(raw.egg),
      tool: coerceSection(raw.tool), decor: coerceSection(raw.decor)
    };
  }

  function rememberShopSnapshot(raw) {
    const shops = coerceShopSnapshot(raw);
    if (shops) state.shops = shops;
    return shops;
  }

  function coercePurchaseSnapshot(raw) {
    return raw && typeof raw === "object" ? raw : null;
  }

  function rememberPurchaseSnapshot(raw) {
    const purchases = coercePurchaseSnapshot(raw);
    if (purchases) state.purchases = purchases;
    return purchases;
  }

  async function watchAtom(atom, onNext) {
    if (!atom || typeof atom.onChange !== "function") return;
    try {
      const unsub = await atom.onChange((next) => {
        try { onNext(next); } catch {}
      });
      if (typeof unsub === "function") state.shopUnsubs.push(unsub);
    } catch {}
  }

  async function ensureShopWatch(atoms = getAtoms()) {
    if (state.shopWatchStarted) return;
    if (!atoms?.shop) return;
    state.shopWatchStarted = true;
    await watchAtom(atoms.shop.shops, rememberShopSnapshot);
    await watchAtom(atoms.shop.seedShop, (seed) => rememberShopSnapshot({ ...(state.shops || {}), seed }));
    await watchAtom(atoms.shop.eggShop, (egg) => rememberShopSnapshot({ ...(state.shops || {}), egg }));
    await watchAtom(atoms.shop.toolShop, (tool) => rememberShopSnapshot({ ...(state.shops || {}), tool }));
    await watchAtom(atoms.shop.decorShop, (decor) => rememberShopSnapshot({ ...(state.shops || {}), decor }));
    await watchAtom(atoms.shop.myShopPurchases, rememberPurchaseSnapshot);
    await watchAtom(atoms.root?.state, (next) => rememberShopSnapshot(getPath(next, ["child", "data", "shops"])));
    await watchAtom(atoms.data?.myData, (next) => rememberPurchaseSnapshot(getPath(next, ["shopPurchases"])));
  }

  async function readShopSnapshot(options = {}) {
    const atoms = options.waitAtoms ? await waitForAtoms() : getAtoms();
    await ensureShopWatch(atoms);
    const direct = rememberShopSnapshot(await readAtom(atoms?.shop?.shops));
    if (direct) return direct;

    const sectionSnap = {
      seed: await readAtom(atoms?.shop?.seedShop),
      egg: await readAtom(atoms?.shop?.eggShop),
      tool: await readAtom(atoms?.shop?.toolShop),
      decor: await readAtom(atoms?.shop?.decorShop)
    };
    const sections = rememberShopSnapshot(sectionSnap);
    if (sections) return sections;

    const stateShops = rememberShopSnapshot(getPath(await readAtom(atoms?.root?.state), ["child", "data", "shops"]));
    return stateShops || state.shops;
  }

  async function readPurchaseSnapshot(options = {}) {
    const atoms = options.waitAtoms ? await waitForAtoms() : getAtoms();
    await ensureShopWatch(atoms);
    const direct = rememberPurchaseSnapshot(await readAtom(atoms?.shop?.myShopPurchases));
    if (direct) return direct;
    const fromData = rememberPurchaseSnapshot(getPath(await readAtom(atoms?.data?.myData), ["shopPurchases"]));
    return fromData || state.purchases;
  }

  function shopItemId(kind, item) {
    if (!item || typeof item !== "object") return "";
    if (kind === "seed") return String(item.species || "");
    if (kind === "egg") return String(item.eggId || "");
    if (kind === "tool") return String(item.toolId || "");
    if (kind === "decor") return String(item.decorId || "");
    return "";
  }

  function findShopItem(shops, kind, id) {
    const list = Array.isArray(shops?.[kind]?.inventory) ? shops[kind].inventory : [];
    return list.find((item) => shopItemId(kind, item) === id) || null;
  }

  function purchaseCountFromSnapshot(purchases, kind, id) {
    const n = purchases?.[kind]?.purchases?.[id];
    return Number.isFinite(Number(n)) && Number(n) > 0 ? Math.floor(Number(n)) : 0;
  }

  async function freshPurchaseCount(kind, id) {
    return purchaseCountFromSnapshot(await readPurchaseSnapshot(), kind, id);
  }

  function stockRemainingFromItem(kind, id, item, purchases) {
    if (!item) return 0;
    const explicit = [item.stock, item.remainingStock, item.availableStock, item.count].map(Number).find((n) => Number.isFinite(n) && n >= 0);
    if (explicit != null) return Math.floor(explicit);
    const initial = Number(item.initialStock);
    if (!Number.isFinite(initial)) return 1;
    return Math.max(0, Math.floor(initial - purchaseCountFromSnapshot(purchases, kind, id)));
  }

  async function waitForShopSnapshot(timeoutMs = 2500) {
    const started = Date.now();
    do {
      const shops = await readShopSnapshot({ waitAtoms: true });
      if (shops) return shops;
      await sleep(150);
    } while (Date.now() - started < timeoutMs);
    return state.shops;
  }

  async function freshStockRemaining(kind, id, options = {}) {
    const shops = options.wait ? await waitForShopSnapshot() : await readShopSnapshot();
    if (!shops) return null;
    const item = findShopItem(shops, kind, id);
    if (!item) return 0;
    return stockRemainingFromItem(kind, id, item, await readPurchaseSnapshot());
  }

  // Đọc trực tiếp từ Atoms (giống quinoa stockBuyerReadShopsNow/stockBuyerReadPurchasesNow)
  async function directReadShops() {
    const atoms = getAtoms();
    try {
      const raw = await atoms?.shop?.shops?.get();
      if (raw) { rememberShopSnapshot(raw); return coerceShopSnapshot(raw); }
    } catch {}
    return state.shops;
  }

  async function directReadPurchases() {
    const atoms = getAtoms();
    try {
      const raw = await atoms?.shop?.myShopPurchases?.get();
      if (raw) { rememberPurchaseSnapshot(raw); return raw; }
    } catch {}
    return state.purchases;
  }

  async function directRemaining(kind, id) {
    const shops = await directReadShops();
    if (!shops) return null;
    const item = findShopItem(shops, kind, id);
    if (!item) return 0;
    const purchases = await directReadPurchases();
    return stockRemainingFromItem(kind, id, item, purchases);
  }

  async function directPurchaseCount(kind, id) {
    const purchases = await directReadPurchases();
    return purchaseCountFromSnapshot(purchases, kind, id);
  }

  function inventoryAtom(kind) {
    const atoms = getAtoms();
    if (kind === "seed") return atoms?.inventory?.mySeedInventory;
    if (kind === "egg") return atoms?.inventory?.myEggInventory;
    if (kind === "tool") return atoms?.inventory?.myToolInventory;
    if (kind === "decor") return atoms?.inventory?.myDecorInventory;
    return null;
  }

  function inventoryEntryMatches(kind, id, item) {
    if (!item || typeof item !== "object") return false;
    const type = String(item.itemType || "");
    if (kind === "seed") return (!type || type === "Seed") && String(item.species || "") === id;
    if (kind === "egg") return (!type || type === "Egg") && String(item.eggId || "") === id;
    if (kind === "tool") return (!type || type === "Tool") && String(item.toolId || "") === id;
    if (kind === "decor") return (!type || type === "Decor") && String(item.decorId || "") === id;
    return false;
  }

  function inventoryQuantity(item) {
    const n = Number(item?.quantity);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  }

  async function inventoryCount(kind, id) {
    const atoms = getAtoms();
    let total = 0;
    // Đọc từ atom riêng theo kind
    const raw = await readAtom(inventoryAtom(kind));
    const list = Array.isArray(raw) ? raw : [];
    for (const item of list) {
      if (inventoryEntryMatches(kind, id, item)) total += inventoryQuantity(item);
    }
    // Fallback: đọc từ myInventory tổng (giống quinoa)
    try {
      const rawAll = await readAtom(atoms?.inventory?.myInventory);
      const allItems = Array.isArray(rawAll) ? rawAll : [];
      let fallbackTotal = 0;
      for (const item of allItems) {
        if (inventoryEntryMatches(kind, id, item)) fallbackTotal += inventoryQuantity(item);
      }
      total = Math.max(total, fallbackTotal);
    } catch {}
    return total;
  }

  async function isInventoryFull() {
    const atoms = getAtoms();
    try {
      const atom = atoms?.inventory?.isMyInventoryAtMaxLength;
      if (atom && typeof atom.get === "function") return !!(await atom.get());
    } catch {}
    return false;
  }

  async function waitForPurchaseConfirmation(kind, id, before, timeoutMs = 3500) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const remaining = await freshStockRemaining(kind, id);
      const inventory = await inventoryCount(kind, id);
      const purchases = await freshPurchaseCount(kind, id);
      if (
        (remaining !== null && remaining < before.remaining) ||
        inventory > before.inventory ||
        purchases > before.purchases
      ) {
        return { remaining, inventory, purchases };
      }
      await sleep(140);
    }
    return null;
  }

  function buildPurchasePayload(kind, id) {
    kind = normalizeKind(kind);
    const meta = KIND_META[kind];
    const cleanId = String(id || "").trim();
    if (!meta) throw new Error(`Unknown kind: ${kind}`);
    if (!cleanId) throw new Error("Missing item id");
    return {
      scopePath: SCOPE_PATH, type: "PurchaseShopItem", shop: kind,
      item: { itemType: meta.itemType, [meta.field]: cleanId },
      __qwsStockBuyer: true
    };
  }

  function itemKey(kind, id) {
    return `${normalizeKind(kind)}:${String(id || "").trim()}`;
  }

  function priceFor(kind, id) {
    return PRICE_CATALOG[itemKey(kind, id)] || 0;
  }

  function formatCoins(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "0";
    return Math.round(n).toLocaleString("en-US");
  }

  function recordPurchase(kind, id, count = 1) {
    const n = clampInt(count, 1, 1, 50);
    const key = itemKey(kind, id);
    const spent = priceFor(kind, id) * n;
    const stats = state.config.stats || defaultStats();
    stats.totalSent += n;
    stats.totalSpent += spent;
    stats.byKind[kind] = (stats.byKind[kind] || 0) + n;
    stats.byItem[key] = (stats.byItem[key] || 0) + n;
    state.config.stats = normalizeStats(stats);
    pageWin.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(state.config)));
  }

  function clearStats() {
    state.config.stats = defaultStats();
    addLog("Đã reset thống kê", null, "warn");
    saveConfig();
  }

  function displayName(id) {
    return String(id || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  }

  function addLog(text, detail, level = "info") {
    const entry = {
      at: new Date().toLocaleTimeString("vi-VN", { hour12: false }), // Giữ at trong data nếu cần debug ngầm
      text, level, detail: detail ? clone(detail) : null
    };
    state.logs.unshift(entry);
    state.logs = state.logs.slice(0, 80);
    state.lastStatus = text;
    log(text, detail || "");
    render();
    return entry;
  }

  function sendToGame(payload) {
    const conn = getRoomConnection();
    // 1. Ưu tiên Conn.sendMessage để quinoa interceptor xử lý (xóa flag __qwsStockBuyer trước khi gửi server)
    if (conn && typeof conn.sendMessage === "function") {
      conn.sendMessage(payload);
      log("Gửi qua Conn.sendMessage", payload);
      return true;
    }
    if (conn?.prototype && typeof conn.prototype.sendMessage === "function") {
      conn.prototype.sendMessage.call(conn, payload);
      log("Gửi qua Conn.prototype.sendMessage", payload);
      return true;
    }
    // 2. Thử gửi qua quinoaWS (global mà quinoa expose)
    const qws = pageWin.quinoaWS || pageWin.__quinoaWS;
    if (qws && qws.readyState === 1 && typeof qws.send === "function") {
      qws.send(JSON.stringify(payload));
      log("Gửi qua quinoaWS", payload);
      return true;
    }
    // 3. Gửi qua tracked socket
    const candidates = getSocketCandidates(conn);
    const socket = candidates.find(isOpenSocket);
    if (socket) {
      socket.send(JSON.stringify(payload));
      log("Gửi qua tracked socket", { readyState: socket.readyState, candidates: candidates.length });
      return true;
    }
    log("KHÔNG TÌM THẤY WEBSOCKET!", { qws: !!qws, qwsState: qws?.readyState, conn: !!conn, tracked: trackedWebSockets.length });
    throw new Error("Không tìm thấy kết nối WebSocket");
  }

  async function sleep(ms) {
    await new Promise((resolve) => root.setTimeout(resolve, ms));
  }

  async function buy(kind, id, options = {}) {
    const payload = buildPurchasePayload(kind, id);
    const sent = [];
    // Dùng directRemaining (đọc Atoms trực tiếp, nhanh) thay vì freshStockRemaining
    const initialRemaining = await directRemaining(kind, id);
    if (initialRemaining === null) {
      // Fallback: thử đọc qua readShopSnapshot (chậm hơn nhưng có nhiều nguồn)
      const fallback = await freshStockRemaining(kind, id, { wait: true });
      if (fallback === null) {
        addLog(`> Lỗi lấy dữ liệu shop: ${displayName(id)}`, payload, "warn");
        sent.dataError = true;
        return sent;
      }
      if (fallback <= 0) {
        addLog(`> Hết hàng: ${displayName(id)}`, payload, "warn");
        return sent;
      }
    }
    if (initialRemaining !== null && initialRemaining <= 0) {
      addLog(`> Hết hàng: ${displayName(id)}`, payload, "warn");
      return sent;
    }
    const stock = initialRemaining ?? 1;
    const maxCount = options.count ?? state.config.maxPerItem;
    let bought = 0;
    let prevPurchaseCount = await directPurchaseCount(kind, id);

    while (bought < Math.min(maxCount, stock)) {
      // Check túi đồ đầy
      if (await isInventoryFull()) {
        addLog(bought ? `> Đã mua ${bought}x ${displayName(id)}, túi đồ đầy` : `> Túi đồ đầy: ${displayName(id)}`, payload, "warn");
        sent.blocked = true;
        break;
      }
      // Check stock còn lại (direct read nhanh)
      if (bought > 0) {
        const remaining = await directRemaining(kind, id);
        if (remaining !== null && remaining <= 0) {
          addLog(`> Hết hàng, ngắt: ${displayName(id)}`, payload, "warn");
          break;
        }
      }
      try {
        sendToGame(payload);
      } catch (error) {
        addLog(`> Lỗi gửi lệnh mua ${displayName(id)}: ${error.message || error}`, payload, "error");
        break;
      }
      // Xác nhận: chờ purchaseCount tăng
      log(`Chờ xác nhận ${id}, prevPurchaseCount=${prevPurchaseCount}, atoms=`, getAtoms()?.shop?.myShopPurchases ? 'OK' : 'NULL');
      const confirmed = await waitPurchaseCountAbove(kind, id, prevPurchaseCount, 4000);
      log(`Kết quả: confirmed=${confirmed}, prev=${prevPurchaseCount}, state.purchases=`, state.purchases);
      if (confirmed <= prevPurchaseCount) {
        addLog(bought ? `> Đã mua ${bought}x, lệnh tiếp không xác nhận: ${displayName(id)}` : `> Không mua được ${displayName(id)}: server không xác nhận`, payload, "error");
        break;
      }
      const delta = confirmed - prevPurchaseCount;
      bought += delta;
      prevPurchaseCount = confirmed;
      recordPurchase(kind, id, delta);
      sent.push(clone(payload));
      addLog(`> Đã mua ${displayName(id)} (${bought}/${Math.min(maxCount, stock)})`, payload, "success");
      if (bought < Math.min(maxCount, stock)) await sleep(state.config.delayMs);
    }
    return sent;
  }

  async function waitPurchaseCountAbove(kind, id, before, timeoutMs = 4000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      // Check cached state trước (update bởi WS message capture - nhanh nhất)
      const cached = purchaseCountFromSnapshot(state.purchases, kind, id);
      if (cached > before) return cached;
      // Fallback: đọc atoms trực tiếp
      const direct = await directPurchaseCount(kind, id);
      if (direct > before) return direct;
      await sleep(80);
    }
    // Lần cuối: check cả 2 nguồn
    const final = Math.max(
      purchaseCountFromSnapshot(state.purchases, kind, id),
      await directPurchaseCount(kind, id)
    );
    return final;
  }

  async function runOnce() {
    if (state.running) return false;
    state.running = true;
    render();
    try {
      const items = state.config.items.slice();
      if (!items.length) {
        addLog("> Chưa thêm item để quét", null, "warn");
        return false;
      }
      let totalBought = 0;
      let dataErrors = 0;
      addLog(`> Đang quét ${items.length} mặt hàng...`, null, "info");
      for (const item of items) {
        const result = await buy(item.kind, item.id, { count: state.config.maxPerItem });
        totalBought += result.length;
        if (result.dataError) dataErrors++;
        await sleep(state.config.delayMs);
      }
      addLog(
        totalBought > 0 ? `> Quét xong: Mua thành công ${totalBought} món` : dataErrors > 0 ? `> Quét xong: Chưa đọc được dữ liệu shop (${dataErrors} món)` : "> Quét xong: Không có hàng",
        null,
        totalBought > 0 ? "success" : "warn"
      );
      return totalBought > 0;
    } catch (error) {
      addLog(`> Lỗi tiến trình quét: ${error.message || error}`, null, "error");
      return false;
    } finally {
      state.running = false;
      render();
    }
  }

  function schedule() {
    if (state.timer !== null) {
      root.clearTimeout(state.timer);
      state.timer = null;
    }
    if (!state.config.enabled) return;
    state.timer = root.setTimeout(async () => {
      state.timer = null;
      await runOnce();
      schedule();
    }, state.config.intervalSec * 1000);
  }

  function addItem(kind, id) {
    const item = normalizeItem({ kind, id });
    if (!item) throw new Error("Missing kind or item id");
    const key = `${item.kind}:${item.id}`;
    if (!state.config.items.some((entry) => `${entry.kind}:${entry.id}` === key)) {
      state.config.items.push(item);
      addLog(`> Đã thêm: ${displayName(item.id)}`, null, "success");
      saveConfig();
    } else {
      addLog(`> ${displayName(item.id)} đã tồn tại trong list`, null, "warn");
    }
    return item;
  }

  function removeItem(kind, id) {
    const item = normalizeItem({ kind, id });
    if (!item) return false;
    const before = state.config.items.length;
    state.config.items = state.config.items.filter((entry) => !(entry.kind === item.kind && entry.id === item.id));
    const removed = state.config.items.length !== before;
    if (removed) {
      addLog(`> Đã xóa: ${displayName(item.id)}`, null, "warn");
      saveConfig();
    }
    return removed;
  }

  function setEnabled(value) {
    state.config.enabled = !!value;
    addLog(state.config.enabled ? "> Auto Mode: BẬT" : "> Auto Mode: TẮT", null, state.config.enabled ? "success" : "warn");
    saveConfig();
    return state.config.enabled;
  }

  function icon(name) {
    const attrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
    const paths = {
      cart: '<path d="M6 6h15l-1.5 8h-13z"/><path d="M6 6 5 3H2"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>',
      coin: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10"/><path d="M15 9.5c-.8-.7-2.2-1-3.2-.5-1.5.7-1.2 2.4.3 2.8l1.8.5c1.6.4 1.9 2.2.3 2.9-1.1.5-2.8.2-3.7-.7"/>',
      bolt: '<path d="m13 2-9 13h8l-1 7 9-13h-8z"/>',
      list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
      plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
      play: '<path d="m8 5 11 7-11 7z"/>',
      trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      check: '<path d="m5 12 5 5L20 7"/>',
      warn: '<path d="M12 3 2 21h20z"/><path d="M12 9v5"/><path d="M12 17h.01"/>',
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
      chevronDown: '<path d="m6 9 6 6 6-6"/>',
      chevronUp: '<path d="m18 15-6-6-6 6"/>'
    };
    return `<svg ${attrs}>${paths[name] || paths.check}</svg>`;
  }

  let host = null;
  let shadow = null;

  function ensurePanel() {
    if (host && shadow) return;
    host = document.createElement("div");
    host.id = "mg-stock-buyer-standalone";
    shadow = host.attachShadow({ mode: "open" });
    document.documentElement.appendChild(host);
  }

  function css() {
    return `
      :host { all: initial; }
      * { box-sizing: border-box; }
      .panel {
        position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
        width: 380px; font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
        font-size: 14px; color: #DBDEE1; 
        
        /* Glassmorphism Effect */
        background: rgba(30, 31, 34, 0.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        
        display: flex; flex-direction: column; overflow: hidden;
        transition: max-height 0.3s ease, width 0.3s ease;
      }
      .panel.min { width: max-content; min-width: 180px; }
      .panel.min .body { display: none; }
      
      .head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 16px; 
        background: rgba(255, 255, 255, 0.05); 
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        font-weight: 600; cursor: pointer; user-select: none; color: #F2F3F5;
      }
      .head:hover { background: rgba(255, 255, 255, 0.1); }
      .brand { display: flex; align-items: center; gap: 8px; }
      
      .body { display: flex; flex-direction: column; gap: 14px; padding: 14px; max-height: 80vh; overflow-y: auto; }
      
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.25); }

      .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: rgba(255, 255, 255, 0.6); display: flex; justify-content: space-between; margin-bottom: -4px; }
      svg { width: 16px; height: 16px; }

      .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .stat { 
        background: rgba(0, 0, 0, 0.2); padding: 10px; border-radius: 8px; 
        display: flex; flex-direction: column; gap: 4px; border: 1px solid rgba(255, 255, 255, 0.05); 
      }
      .stat span { font-size: 12px; color: rgba(255, 255, 255, 0.6); display: flex; align-items: center; gap: 6px; }
      .stat b { font-size: 16px; color: #F2F3F5; font-variant-numeric: tabular-nums; }

      .controls { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; }
      button {
        background: rgba(255, 255, 255, 0.1); color: #FFF; border: 1px solid rgba(255, 255, 255, 0.05); padding: 8px 12px;
        border-radius: 6px; font-family: inherit; font-size: 13px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; outline: none;
      }
      button:hover { background: rgba(255, 255, 255, 0.2); }
      button.primary { background: rgba(88, 101, 242, 0.8); border: none; }
      button.primary:hover { background: rgba(88, 101, 242, 1); }
      button.success { background: rgba(35, 165, 89, 0.8); border: none; }
      button.success:hover { background: rgba(35, 165, 89, 1); }
      button.danger { background: rgba(218, 55, 60, 0.8); border: none; }
      button.danger:hover { background: rgba(218, 55, 60, 1); }
      button.ghost { background: transparent; color: rgba(255, 255, 255, 0.6); padding: 6px; border: none; }
      button.ghost:hover { background: rgba(255, 255, 255, 0.1); color: #FFF; }
      .danger-txt:hover { color: #DA373C !important; }

      .row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
      input, select {
        background: rgba(0, 0, 0, 0.2); color: #DBDEE1; border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 8px 10px; border-radius: 6px; outline: none; flex: 1; font-family: inherit; font-size: 13px;
      }
      input[type="number"] { width: 60px; flex: none; text-align: center; padding: 8px 4px; }
      input:focus, select:focus { border-color: rgba(88, 101, 242, 0.8); }
      
      /* Range Slider CSS */
      input[type="range"] {
        -webkit-appearance: none; background: transparent; padding: 0; outline: none; border: none; height: 16px; flex: 1; margin: 0 4px;
      }
      input[type="range"]::-webkit-slider-runnable-track {
        width: 100%; height: 6px; background: rgba(0, 0, 0, 0.3); border-radius: 3px; border: 1px solid rgba(255, 255, 255, 0.05); cursor: pointer;
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none; height: 16px; width: 16px; border-radius: 50%; background: #5865F2; margin-top: -6px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.5);
      }
      input[type="range"]:focus::-webkit-slider-thumb { background: #4752C4; }

      optgroup { background: #1E1F22; color: #949BA4; }
      option { background: #2B2D31; color: #DBDEE1; }

      .list { display: flex; flex-direction: column; gap: 6px; max-height: 180px; overflow-y: auto; padding-right: 4px; }
      .item {
        display: flex; align-items: center; padding: 6px 10px;
        background: rgba(0, 0, 0, 0.2); border-radius: 6px; gap: 8px; border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .item .badge { background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 11px; color: rgba(255, 255, 255, 0.6); font-weight: 600; text-transform: uppercase; width: 50px; text-align: center; }
      .item .id { flex: 1; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .item .num { font-variant-numeric: tabular-nums; color: rgba(255, 255, 255, 0.6); font-size: 12px; }
      
      .log {
        background: rgba(0, 0, 0, 0.2); border-radius: 6px; padding: 8px; border: 1px solid rgba(255, 255, 255, 0.05);
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 12px;
        height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
      }
      .log-entry { display: flex; gap: 8px; }
      .log-text { flex: 1; word-break: break-word; }
      .log-entry--success .log-text { color: #57F287; }
      .log-entry--error .log-text { color: #ED4245; }
      .log-entry--warn .log-text { color: #FEE75C; }
      .log-entry--info .log-text { color: #5865F2; }
      .muted { color: rgba(255, 255, 255, 0.5); }
    `;
  }

  function render() {
    ensurePanel();
    const cfg = state.config;
    const stats = cfg.stats || defaultStats();
    
    const itemOptions = Object.entries(ITEM_CATALOG).map(([kind, ids]) => {
      const meta = KIND_META[kind];
      const options = ids.map((id) => `<option value="${escapeAttr(kind)}:${escapeAttr(id)}">${escapeHtml(displayName(id))}</option>`).join("");
      return `<optgroup label="${escapeAttr(meta?.label || kind)}">${options}</optgroup>`;
    }).join("");
    
    const itemRows = cfg.items.length ? cfg.items.map((item) => `
      <div class="item">
        <div class="badge">${KIND_META[item.kind]?.label || item.kind}</div>
        <div class="id" title="${escapeHtml(item.id)}">${escapeHtml(displayName(item.id))}</div>
        <div class="num" title="Đã mua">x${stats.byItem[itemKey(item.kind, item.id)] || 0}</div>
        <button class="ghost" data-buy="${escapeAttr(item.kind)}:${escapeAttr(item.id)}" title="Mua ngay 1 lần">${icon("cart")}</button>
        <button class="ghost danger-txt" data-remove="${escapeAttr(item.kind)}:${escapeAttr(item.id)}" title="Xóa">${icon("trash")}</button>
      </div>
    `).join("") : `<div class="muted" style="text-align:center; padding: 10px;">Chưa đăng ký stock nào.</div>`;
    
    // Removed timestamp here
    const logRows = state.logs.length ? state.logs.map((entry) => `
      <div class="log-entry log-entry--${escapeAttr(entry.level || "info")}">
        <span class="log-text">${escapeHtml(entry.text)}</span>
      </div>
    `).join("") : `<div class="muted">Chưa có log hệ thống.</div>`;
    
    let stepIdx = INTERVAL_STEPS.indexOf(cfg.intervalSec);
    if (stepIdx === -1) stepIdx = 3;

    shadow.innerHTML = `
      <style>${css()}</style>
      <div class="panel ${cfg.minimized ? "min" : ""}">
        <div class="head" data-action="minimize">
          <div class="brand">${icon("cart")} <span>Stock Buyer <span class="muted" style="font-size: 11px; font-weight: normal;">v${VERSION}</span></span></div>
          ${cfg.minimized ? icon("chevronUp") : icon("chevronDown")}
        </div>
        <div class="body">
          <div class="stats">
            <div class="stat"><span>${icon("cart")} Tổng mua</span><b>${stats.totalSent || 0}</b></div>
            <div class="stat"><span>${icon("coin")} Tổng chi</span><b>${formatCoins(stats.totalSpent || 0)}</b></div>
          </div>
          
          <div class="controls">
            <button class="${cfg.enabled ? "success" : ""}" data-action="toggle-auto">
              ${cfg.enabled ? icon("bolt") + " Auto: ON" : icon("clock") + " Auto: OFF"}
            </button>
            <button class="primary" data-action="run">${icon("play")} Quét ngay</button>
            <button class="ghost danger-txt" data-action="clear-stats" title="Xóa dữ liệu thống kê">${icon("trash")}</button>
          </div>
          
          <div class="row" style="margin-top: 4px;">
            <span class="muted" style="white-space: nowrap;">Quét mỗi:</span>
            <span id="interval-label" style="font-weight: 600; color: #F2F3F5; width: 32px; text-align: center;">${INTERVAL_LABELS[stepIdx]}</span>
            <input type="range" data-field="intervalSlider" min="0" max="4" step="1" value="${stepIdx}">
            <span class="muted" style="margin-left: 8px;">Mua Tối đa</span>
            <input type="number" data-field="maxPerItem" min="1" max="50" value="${cfg.maxPerItem}">
          </div>
          
          <div class="section-title" style="margin-top: 6px;"><span>Kho Stock Đăng Ký</span><span style="font-weight:normal;">${cfg.items.length} món</span></div>
          <div class="row">
            <select data-add-item>${itemOptions}</select>
            <button class="primary" data-action="add" style="padding: 8px;">${icon("plus")}</button>
          </div>
          <div class="list">${itemRows}</div>
          
          <div class="section-title"><span>System Log</span><span style="font-weight:normal;">${escapeHtml(state.running ? "Đang chạy..." : state.lastStatus)}</span></div>
          <div class="log">${logRows}</div>
        </div>
      </div>
    `;
    bindPanel();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/:/g, "&#58;");
  }

  function bindPanel() {
    shadow.querySelectorAll("[data-field]").forEach((el) => {
      if (el.getAttribute("data-field") === "intervalSlider") {
        el.addEventListener("input", (e) => {
          const idx = parseInt(e.target.value, 10);
          shadow.getElementById("interval-label").textContent = INTERVAL_LABELS[idx];
        });
      }
      
      el.addEventListener("change", () => {
        const field = el.getAttribute("data-field");
        if (field === "enabled") state.config.enabled = !!el.checked;
        else if (field === "maxPerItem") state.config.maxPerItem = clampInt(el.value, DEFAULT_CONFIG.maxPerItem, 1, 50);
        else if (field === "intervalSlider") {
          state.config.intervalSec = INTERVAL_STEPS[parseInt(el.value, 10)];
        }
        saveConfig();
      });
    });

    shadow.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => {
        const action = el.getAttribute("data-action");
        if (action === "minimize") {
          state.config.minimized = !state.config.minimized;
          saveConfig();
        } else if (action === "toggle-auto") {
          setEnabled(!state.config.enabled);
        } else if (action === "add") {
          const selected = shadow.querySelector("[data-add-item]")?.value || "";
          const [kind, ...idParts] = selected.split(":");
          try {
            addItem(kind, idParts.join(":"));
          } catch (error) {
            addLog(error.message || String(error));
          }
        } else if (action === "run") {
          void runOnce();
        } else if (action === "clear-stats") {
          clearStats();
        }
      });
    });

    shadow.querySelectorAll("[data-remove]").forEach((el) => {
      el.addEventListener("click", () => {
        const [kind, ...idParts] = el.getAttribute("data-remove").split(":");
        removeItem(kind, idParts.join(":"));
      });
    });

    shadow.querySelectorAll("[data-buy]").forEach((el) => {
      el.addEventListener("click", () => {
        const [kind, ...idParts] = el.getAttribute("data-buy").split(":");
        void buy(kind, idParts.join(":"), { count: 1 });
      });
    });
  }

  async function debugShopData() {
    const atoms = await waitForAtoms(3000);
    const shops = await readShopSnapshot();
    const purchases = await readPurchaseSnapshot();
    return {
      version: VERSION,
      hasAtoms: !!atoms,
      hasShopAtoms: !!atoms?.shop,
      trackedWebSockets: trackedWebSockets.length,
      cachedShops: !!state.shops,
      cachedPurchases: !!state.purchases,
      shopCounts: shops ? {
        seed: shops.seed.inventory.length,
        egg: shops.egg.inventory.length,
        tool: shops.tool.inventory.length,
        decor: shops.decor.inventory.length
      } : null,
      trackedItems: state.config.items.map((item) => {
        const shopItem = findShopItem(shops, item.kind, item.id);
        return {
          ...item,
          visible: !!shopItem,
          remaining: shops ? stockRemainingFromItem(item.kind, item.id, shopItem, purchases) : null
        };
      })
    };
  }

  const api = {
    version: VERSION, addItem, buildPurchasePayload, buy, config: () => clone(state.config),
    removeItem, runOnce, clearStats, setEnabled, debugShopData, state
  };

  function start() {
    render();
    schedule();
    log("ready", { version: VERSION });
  }

  window.MGStockBuyerStandalone = api;
  if (document.documentElement) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  }
})();
