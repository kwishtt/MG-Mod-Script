// ==UserScript==
// @name         MG: Stock Buyer 
// @namespace    Ketamijn
// @version      0.4.2
// @description  Made by kwishtt
// @match        https://1227719606223765687.discordsays.com/*
// @match        https://magiccircle.gg/r/*
// @match        https://magicgarden.gg/r/*
// @match        https://starweaver.org/r/*
// @run-at       document-start
// @inject-into  page
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const root = window;
  const STORAGE_KEY = "mg-stock-buyer-standalone-config";
  const LEGACY_STORAGE_KEYS = ["mg-stock-buyer-standưalone-config"];
  const LOG_PREFIX = "[MGStockBuyerStandalone]";
  const SCOPE_PATH = ["Room", "Quinoa"];
  const VERSION = "0.4.2";
  const NativeWebSocket = root.WebSocket;
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
    "seed:Carrot": 10,
    "seed:Cabbage": 30,
    "seed:Strawberry": 50,
    "seed:Aloe": 400,
    "seed:Blueberry": 2e3,
    "seed:Apple": 5e3,
    "seed:Tomato": 8e3,
    "seed:Corn": 1.5e4,
    "seed:Watermelon": 3e4,
    "seed:Pumpkin": 5e4,
    "seed:Coconut": 1e5,
    "seed:Banana": 2e5,
    "seed:Cactus": 5e5,
    "egg:CommonEgg": 1e5,
    "egg:UncommonEgg": 1e6,
    "egg:RareEgg": 1e7,
    "egg:LegendaryEgg": 1e8,
    "egg:MythicalEgg": 1e9,
    "egg:WinterEgg": 8e8,
    "egg:SnowEgg": 2e8,
    "egg:HorseEgg": 2e8,
    "tool:WateringCan": 5e3,
    "tool:PlanterPot": 25e3,
    "tool:Shovel": 1e6,
    "tool:CropCleanser": 8e4,
    "decor:SmallRock": 1e3,
    "decor:MediumRock": 2500,
    "decor:LargeRock": 5e3,
    "decor:WoodCaribou": 9e3
  };

  const LEVEL_META = {
    success: { level: "success", label: "Thành công" },
    error: { level: "error", label: "Thất bại" },
    warn: { level: "warn", label: "Cảnh báo" },
    info: { level: "info", label: "Thông tin" }
  };

  const DEFAULT_CONFIG = {
    enabled: false,
    intervalSec: 300,
    maxPerItem: 3,
    delayMs: 450,
    minimized: false,
    stats: {
      totalSent: 0,
      totalSpent: 0,
      byKind: { seed: 0, egg: 0, tool: 0, decor: 0 },
      byItem: {}
    },
    items: []
  };

  const state = {
    config: loadConfig(),
    timer: null,
    running: false,
    lastStatus: "Idle",
    logs: []
  };

  installWebSocketTracker();

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function rememberWebSocket(ws) {
    if (!ws || trackedWebSockets.includes(ws)) return ws;
    trackedWebSockets.push(ws);
    while (trackedWebSockets.length > 12) trackedWebSockets.shift();
    return ws;
  }

  function installWebSocketTracker() {
    if (typeof NativeWebSocket !== "function") return;
    if (root.WebSocket?.__mgStockBuyerWrapped) return;
    function WrappedWebSocket(...args) {
      return rememberWebSocket(new NativeWebSocket(...args));
    }
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
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
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

  function defaultStats() {
    return clone(DEFAULT_CONFIG.stats);
  }

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
      const raw = root.localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map((key) => root.localStorage.getItem(key)).find(Boolean) || "null";
      return normalizeConfig(JSON.parse(raw));
    } catch {
      return normalizeConfig(null);
    }
  }

  function saveConfig() {
    state.config = normalizeConfig(state.config);
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
    for (const key of LEGACY_STORAGE_KEYS) root.localStorage.removeItem(key);
    render();
    schedule();
    return clone(state.config);
  }

  function getRoomConnection() {
    return root.MagicCircle_RoomConnection || root.top?.MagicCircle_RoomConnection || null;
  }

  function getSocketCandidates(conn) {
    const sockets = [
      conn?.currentWebSocket,
      conn?.socket,
      conn?.ws,
      root.quinoaWS,
      root.__quinoaWS,
      ...trackedWebSockets.slice().reverse()
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
    return root.QWS_Atoms || root.Atoms || root.top?.QWS_Atoms || root.top?.Atoms || null;
  }

  async function readAtom(atom) {
    if (!atom || typeof atom.get !== "function") return null;
    try {
      return await atom.get();
    } catch {
      return null;
    }
  }

  function coerceShopSnapshot(raw) {
    if (!raw || typeof raw !== "object") return null;
    const coerceSection = (section) => ({
      inventory: Array.isArray(section?.inventory) ? section.inventory : [],
      secondsUntilRestock: Number(section?.secondsUntilRestock) || 0
    });
    return {
      seed: coerceSection(raw.seed),
      egg: coerceSection(raw.egg),
      tool: coerceSection(raw.tool),
      decor: coerceSection(raw.decor)
    };
  }

  async function readShopSnapshot() {
    const atoms = getAtoms();
    return coerceShopSnapshot(await readAtom(atoms?.shop?.shops));
  }

  async function readPurchaseSnapshot() {
    const atoms = getAtoms();
    const raw = await readAtom(atoms?.shop?.myShopPurchases);
    return raw && typeof raw === "object" ? raw : null;
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

  async function freshStockRemaining(kind, id) {
    const shops = await readShopSnapshot();
    if (!shops) return null;
    const item = findShopItem(shops, kind, id);
    if (!item) return 0;
    return stockRemainingFromItem(kind, id, item, await readPurchaseSnapshot());
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
    const raw = await readAtom(inventoryAtom(kind));
    const list = Array.isArray(raw) ? raw : [];
    let total = 0;
    for (const item of list) {
      if (inventoryEntryMatches(kind, id, item)) total += inventoryQuantity(item);
    }
    return total;
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
      scopePath: SCOPE_PATH,
      type: "PurchaseShopItem",
      shop: kind,
      item: {
        itemType: meta.itemType,
        [meta.field]: cleanId
      }
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
    root.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(state.config)));
  }

  function clearStats() {
    state.config.stats = defaultStats();
    addLog("Đã xóa thống kê", null, "warn");
    saveConfig();
  }

  function displayName(id) {
    return String(id || "").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  }

  function addLog(text, detail, level = "info") {
    const entry = {
      at: new Date().toLocaleTimeString("vi-VN", { hour12: false }),
      text,
      level,
      detail: detail ? clone(detail) : null
    };
    state.logs.unshift(entry);
    state.logs = state.logs.slice(0, 80);
    state.lastStatus = text;
    log(text, detail || "");
    render();
    return entry;
  }

  function sendToGame(payload) {
    const sender = resolveRoomSender();
    if (!sender) {
      throw new Error("Không tìm thấy kết nối game đang mở");
    }
    sender.send(payload);
    return true;
  }

  async function sleep(ms) {
    await new Promise((resolve) => root.setTimeout(resolve, ms));
  }

  async function buy(kind, id, options = {}) {
    const payload = buildPurchasePayload(kind, id);
    const count = clampInt(options.count ?? 1, 1, 1, 50);
    const sent = [];
    const initialRemaining = await freshStockRemaining(kind, id);
    if (initialRemaining === null) {
      addLog(`> Không đọc được dữ liệu shop, bỏ qua ${displayName(id)}`, payload, "warn");
      return sent;
    }
    if (initialRemaining <= 0) {
      addLog(`> ${displayName(id)} stock không còn, bỏ qua`, payload, "warn");
      return sent;
    }
    const limit = Math.min(count, initialRemaining);
    for (let i = 0; i < limit; i++) {
      try {
        const remaining = await freshStockRemaining(kind, id);
        if (remaining === null) {
          addLog(`> Không đọc được dữ liệu shop, dừng mua ${displayName(id)}`, payload, "warn");
          break;
        }
        if (remaining <= 0) {
          addLog(`> ${displayName(id)} stock không còn, dừng mua`, payload, "warn");
          break;
        }
        const before = {
          remaining,
          inventory: await inventoryCount(kind, id),
          purchases: await freshPurchaseCount(kind, id)
        };
        sendToGame(payload);
        const confirmed = await waitForPurchaseConfirmation(kind, id, before);
        if (!confirmed) {
          addLog(`> Chưa xác nhận mua ${displayName(id)}: stock/inventory không đổi`, payload, "error");
          break;
        }
        recordPurchase(kind, id, 1);
        addLog(`> Đã mua ${displayName(id)} (${KIND_META[kind]?.label || kind})`, payload, "success");
      } catch (error) {
        addLog(`> Mua thất bại ${displayName(id)}: ${error.message || error}`, payload, "error");
        throw error;
      }
      sent.push(clone(payload));
      if (i + 1 < count) await sleep(state.config.delayMs);
    }
    return sent;
  }

  async function runOnce() {
    if (state.running) return false;
    state.running = true;
    render();
    try {
      const items = state.config.items.slice();
      if (!items.length) {
        addLog("> Chưa đăng ký item stock", null, "warn");
        return false;
      }
      let totalBought = 0;
      addLog(`> Đang mua ${items.length} item đã đăng ký`, null, "info");
      for (const item of items) {
        const result = await buy(item.kind, item.id, { count: state.config.maxPerItem });
        totalBought += result.length;
        await sleep(state.config.delayMs);
      }
      addLog(totalBought > 0 ? `> Hoàn tất lượt mua: đã mua ${totalBought}` : "> Quét xong: chưa có item nào còn stock", null, totalBought > 0 ? "success" : "warn");
      return totalBought > 0;
    } catch (error) {
      addLog(`> Lượt mua thất bại: ${error.message || error}`, null, "error");
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
      addLog(`> Đã đăng ký stock ${displayName(item.id)}`, null, "success");
      saveConfig();
    } else {
      addLog(`> ${displayName(item.id)} đã có trong danh sách`, null, "warn");
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
      addLog(`> Đã xóa ${displayName(item.id)} khỏi danh sách`, null, "warn");
      saveConfig();
    }
    return removed;
  }

  function setEnabled(value) {
    state.config.enabled = !!value;
    addLog(state.config.enabled ? "> Auto Mode đã bật" : "> Auto Mode đã tắt", null, state.config.enabled ? "success" : "warn");
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
      x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'
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
      :host{all:initial}
      .panel{position:fixed;right:18px;bottom:18px;z-index:2147483647;width:430px;max-width:calc(100vw - 28px);font:13px/1.35 Inter,ui-sans-serif,system-ui,Arial,sans-serif;color:#233044;background:rgba(255,255,255,.76);border:1px solid rgba(255,255,255,.82);border-radius:18px;box-shadow:0 24px 70px rgba(99,102,241,.16),0 8px 28px rgba(15,23,42,.12),inset 0 1px 0 rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(1.35);-webkit-backdrop-filter:blur(20px) saturate(1.35);overflow:hidden}
      .head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:linear-gradient(135deg,rgba(255,255,255,.9),rgba(219,234,254,.68),rgba(240,253,250,.62));border-bottom:1px solid rgba(148,163,184,.2);font-weight:850;color:#0f172a}
      .brand{display:flex;gap:9px;align-items:center}
      .brand svg,.section-title svg,.stat svg,button svg{width:16px;height:16px}
      .body{display:grid;gap:11px;padding:13px}
      .row{display:flex;gap:8px;align-items:center}
      .row>*{min-width:0}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
      .stat{display:grid;gap:3px;padding:10px;border:1px solid rgba(148,163,184,.2);border-radius:14px;background:rgba(255,255,255,.58)}
      .stat span{display:flex;gap:5px;align-items:center}
      .stat b{display:block;font-size:18px;color:#0f172a;font-variant-numeric:tabular-nums}
      .section-title{display:flex;align-items:center;justify-content:space-between;font-weight:850;color:#0f172a}
      .section-title span:first-child{display:flex;gap:7px;align-items:center}
      .add-card{display:grid;gap:8px;padding:10px;border:1px solid rgba(125,211,252,.34);border-radius:16px;background:linear-gradient(135deg,rgba(240,249,255,.72),rgba(236,253,245,.62))}
      .add-card .row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
      .controls{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:8px}
      select,input,button{font:inherit;border-radius:10px;border:1px solid rgba(148,163,184,.3);background:rgba(255,255,255,.76);color:#0f172a;padding:8px 9px;box-shadow:inset 0 1px 0 rgba(255,255,255,.52)}
      input[type="number"]{width:72px}
      select[data-add-item]{flex:1}
      button{display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;background:linear-gradient(135deg,#60a5fa,#5eead4);border-color:rgba(56,189,248,.38);color:#0f172a;font-weight:850;text-shadow:none}
      button.ghost{background:rgba(255,255,255,.65);border-color:rgba(148,163,184,.34);color:#1e293b;text-shadow:none}
      button.danger{background:rgba(254,226,226,.86);border-color:rgba(248,113,113,.42);color:#991b1b;text-shadow:none}
      button.auto{min-width:124px;background:rgba(255,255,255,.72);border-color:rgba(148,163,184,.34);color:#475569}
      button.auto.on{background:linear-gradient(135deg,#bbf7d0,#bae6fd);border-color:rgba(34,197,94,.35);color:#166534}
      label{display:flex;gap:6px;align-items:center}
      .list{display:grid;gap:6px;max-height:170px;overflow:auto}
      .item{display:grid;grid-template-columns:58px minmax(0,1fr) 56px 46px 34px;gap:6px;align-items:center;padding:7px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:rgba(255,255,255,.56)}
      .id{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .num{text-align:right;font-variant-numeric:tabular-nums;color:#334155}
      .log{height:132px;overflow:auto;display:grid;align-content:start;gap:6px;border:1px solid rgba(148,163,184,.2);border-radius:14px;padding:8px;background:rgba(248,250,252,.58);font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#334155}
      .log-entry{padding:7px 8px;border-radius:10px;border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.56)}
      .log-entry--success{background:rgba(220,252,231,.72);border-color:rgba(74,222,128,.35);color:#166534}
      .log-entry--error{background:rgba(254,226,226,.78);border-color:rgba(248,113,113,.38);color:#991b1b}
      .log-entry--warn{background:rgba(254,249,195,.82);border-color:rgba(250,204,21,.38);color:#854d0e}
      .log-entry--info{background:rgba(219,234,254,.72);border-color:rgba(96,165,250,.32);color:#1e3a8a}
      .muted{color:#64748b}
      .min .body{display:none}
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
        <div>${KIND_META[item.kind]?.label || item.kind}</div>
        <div class="id" title="${escapeHtml(item.id)}">${escapeHtml(displayName(item.id))}</div>
        <div class="num" title="Bought">${stats.byItem[itemKey(item.kind, item.id)] || 0}</div>
        <button class="ghost" data-buy="${escapeAttr(item.kind)}:${escapeAttr(item.id)}" title="Buy">${icon("cart")}</button>
        <button class="danger" data-remove="${escapeAttr(item.kind)}:${escapeAttr(item.id)}" title="Remove">${icon("x")}</button>
      </div>
    `).join("") : `<div class="muted">Chưa đăng ký stock.</div>`;
    const logRows = state.logs.length ? state.logs.map((entry) => `<div class="log-entry log-entry--${escapeAttr(entry.level || "info")}">[${entry.at}] ${escapeHtml(entry.text)}</div>`).join("") : `<div class="muted">Chưa có log.</div>`;
    shadow.innerHTML = `
      <style>${css()}</style>
      <div class="panel ${cfg.minimized ? "min" : ""}">
        <div class="head">
          <div class="brand">${icon("cart")}<span>Stock Buyer</span><span class="muted">v${VERSION}</span></div>
          <button class="ghost" data-action="minimize">${cfg.minimized ? "Open" : "Min"}</button>
        </div>
        <div class="body">
          <div class="stats">
            <div class="stat"><span class="muted">${icon("cart")} Đã mua</span><b>${stats.totalSent || 0}</b></div>
            <div class="stat"><span class="muted">${icon("coin")} Đã chi</span><b>${formatCoins(stats.totalSpent || 0)}</b></div>
            <div class="stat"><span class="muted">${icon("check")} Seeds</span><b>${stats.byKind.seed || 0}</b></div>
            <div class="stat"><span class="muted">${icon("list")} Other</span><b>${(stats.byKind.egg || 0) + (stats.byKind.tool || 0) + (stats.byKind.decor || 0)}</b></div>
          </div>
          <div class="controls">
            <button class="auto ${cfg.enabled ? "on" : ""}" data-action="toggle-auto">${cfg.enabled ? `${icon("bolt")} Auto ON` : `${icon("clock")} Auto OFF`}</button>
            <span class="muted">${escapeHtml(state.running ? "Running" : state.lastStatus)}</span>
            <button data-action="run">${icon("play")} Mua ngay</button>
            <button class="ghost" data-action="clear-stats" title="Clear stats">${icon("trash")}</button>
          </div>
          <div class="row">
            <span>${icon("clock")} Mỗi</span>
            <input type="number" data-field="intervalSec" min="5" max="3600" value="${cfg.intervalSec}">
            <span>giây</span>
            <span>SL</span>
            <input type="number" data-field="maxPerItem" min="1" max="50" value="${cfg.maxPerItem}">
          </div>
          <div class="add-card">
            <div class="section-title"><span>${icon("plus")} Thêm item</span><span class="muted">Chọn từ catalog</span></div>
            <div class="row">
              <select data-add-item>${itemOptions}</select>
              <button data-action="add">${icon("plus")} Add</button>
            </div>
          </div>
          <div class="section-title"><span>${icon("list")} Registered Stock</span><span class="muted">Bought</span></div>
          <div class="list">${itemRows}</div>
          <div class="section-title"><span>${icon("warn")} Log</span><span class="muted">Pastel status</span></div>
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
      el.addEventListener("change", () => {
        const field = el.getAttribute("data-field");
        if (field === "enabled") state.config.enabled = !!el.checked;
        if (field === "intervalSec") state.config.intervalSec = clampInt(el.value, DEFAULT_CONFIG.intervalSec, 5, 3600);
        else if (field === "maxPerItem") state.config.maxPerItem = clampInt(el.value, DEFAULT_CONFIG.maxPerItem, 1, 50);
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
        } else if (action === "save") {
          saveConfig();
          addLog("Saved");
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

  const api = {
    version: VERSION,
    addItem,
    buildPurchasePayload,
    buy,
    config: () => clone(state.config),
    removeItem,
    runOnce,
    clearStats,
    setEnabled,
    state
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
