(() => {
  "use strict";

  const root = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
  const LOG_PREFIX = "[MGStockBuyerProbe]";
  const VERSION = "2026-06-02.6";
  const DEFAULT_SCOPE_PATH = ["Room", "Quinoa"];
  const config = {
    dryRun: true,
    delayMs: 900,
    includeScopePath: true,
    target: {
      kind: "seed",
      id: ""
    }
  };

  const trackedSockets = new Set();
  const sentLog = [];
  const recordedMessages = [];
  let recordingEnabled = false;
  let recorderInstalled = false;
  const PLACEHOLDER_IDS = new Set([
    "",
    "ITEM_ID_OR_SPECIES",
    "<item-id>",
    "<species>",
    "item-id",
    "item_id",
    "species"
  ]);

  const KIND_META = {
    seed: {
      type: "PurchaseSeed",
      field: "species",
      itemType: "Seed"
    },
    egg: {
      type: "PurchaseEgg",
      field: "eggId",
      itemType: "Egg"
    },
    tool: {
      type: "PurchaseTool",
      field: "toolId",
      itemType: "Tool"
    },
    decor: {
      type: "PurchaseDecor",
      field: "decorId",
      itemType: "Decor"
    }
  };

  function now() {
    return new Date().toISOString();
  }

  function log(...args) {
    console.log(LOG_PREFIX, ...args);
  }

  function warn(...args) {
    console.warn(LOG_PREFIX, ...args);
  }

  function clone(value) {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function getPayloadItemId(payload) {
    return String(
      payload?.species ??
      payload?.eggId ??
      payload?.toolId ??
      payload?.decorId ??
      payload?.id ??
      payload?.item?.species ??
      payload?.item?.eggId ??
      payload?.item?.toolId ??
      payload?.item?.decorId ??
      payload?.item?.id ??
      ""
    ).trim();
  }

  function assertLivePayload(payload) {
    const id = getPayloadItemId(payload);
    if (PLACEHOLDER_IDS.has(id)) {
      throw new Error(`Refusing live purchase with placeholder item id: ${id || "(empty)"}`);
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

  function buildPayload(kind, id, variant = "stockBuyer") {
    const normalizedKind = normalizeKind(kind);
    const meta = KIND_META[normalizedKind];
    const cleanId = String(id || "").trim();
    if (!meta) throw new Error(`Unknown shop kind: ${kind}`);
    if (!cleanId) throw new Error("Missing item id");

    const payload = variant === "shopItem" || variant === "shopItemNoScope"
      ? {
        type: "PurchaseShopItem",
        shop: normalizedKind,
        item: {
          itemType: meta.itemType,
          [meta.field]: cleanId
        }
      }
      : {
        type: meta.type,
        [meta.field]: cleanId
      };

    if (variant === "idAlias") {
      delete payload[meta.field];
      payload.id = cleanId;
    } else if (variant === "bothIds") {
      payload.id = cleanId;
    }

    if (variant === "stockBuyer" || variant === "stockBuyerNoScope") {
      payload.__qwsStockBuyer = true;
    }

    if (config.includeScopePath && variant !== "noScope" && variant !== "stockBuyerNoScope" && variant !== "shopItemNoScope") {
      payload.scopePath = ["Room", "Quinoa"];
    }

    return payload;
  }

  function cases(kind = config.target.kind, id = config.target.id) {
    return [
      {
        name: "shopItem",
        note: "Current UI purchase shape recorded from the real shop button.",
        payload: buildPayload(kind, id, "shopItem")
      },
      {
        name: "shopItemNoScope",
        note: "Current UI purchase shape without explicit Room/Quinoa scopePath.",
        payload: buildPayload(kind, id, "shopItemNoScope")
      },
      {
        name: "stockBuyer",
        note: "Current Stock Buyer shape with __qwsStockBuyer marker and scopePath.",
        payload: buildPayload(kind, id, "stockBuyer")
      },
      {
        name: "normal",
        note: "Normal purchase shape, no Stock Buyer marker.",
        payload: buildPayload(kind, id, "normal")
      },
      {
        name: "noScope",
        note: "Normal purchase shape without explicit Room/Quinoa scopePath.",
        payload: buildPayload(kind, id, "noScope")
      },
      {
        name: "stockBuyerNoScope",
        note: "Stock Buyer marker without explicit Room/Quinoa scopePath.",
        payload: buildPayload(kind, id, "stockBuyerNoScope")
      },
      {
        name: "idAlias",
        note: "Uses id instead of the typed id field.",
        payload: buildPayload(kind, id, "idAlias")
      },
      {
        name: "bothIds",
        note: "Uses both typed id field and id alias.",
        payload: buildPayload(kind, id, "bothIds")
      }
    ];
  }

  function getRoomConnection() {
    return root.MagicCircle_RoomConnection || root.top?.MagicCircle_RoomConnection || null;
  }

  function isPurchaseLike(message) {
    return /^Purchase/i.test(String(message?.type || ""));
  }

  function installSendRecorder() {
    if (recorderInstalled) return true;
    const conn = getRoomConnection();
    if (!conn || typeof conn.sendMessage !== "function") return false;
    const original = conn.sendMessage;
    if (original.__mgStockBuyerProbeRecorder) {
      recorderInstalled = true;
      return true;
    }
    conn.sendMessage = function(message, ...rest) {
      if (recordingEnabled) {
        const entry = {
          at: now(),
          purchaseLike: isPurchaseLike(message),
          message: clone(message)
        };
        recordedMessages.push(entry);
        if (entry.purchaseLike) log("recorded purchase-like message", entry);
      }
      return original.call(this, message, ...rest);
    };
    conn.sendMessage.__mgStockBuyerProbeRecorder = true;
    conn.sendMessage.__originalSendMessage = original;
    recorderInstalled = true;
    return true;
  }

  function startRecording(options = {}) {
    if (!installSendRecorder()) {
      throw new Error("Cannot install recorder: MagicCircle_RoomConnection.sendMessage is not available");
    }
    if (options.clear !== false) recordedMessages.length = 0;
    recordingEnabled = true;
    log("recording started. Now click a real shop buy button in the UI, then run MGStockBuyerProbe.recorded().");
    return true;
  }

  function stopRecording() {
    recordingEnabled = false;
    log("recording stopped", recordedMessages);
    return recordedMessages.slice();
  }

  function recorded() {
    log("recorded messages", recordedMessages);
    return recordedMessages.slice();
  }

  function getRoomConnectionSocket() {
    try {
      const conn = getRoomConnection();
      return conn?.currentWebSocket || conn?.socket || conn?.ws || null;
    } catch {
      return null;
    }
  }

  function getRoomApiBase() {
    const socket = getRoomConnectionSocket();
    const rawUrl = String(socket?.url || "");
    const match = rawUrl.match(/\/version\/([^/]+)\/api\/rooms\/([^/]+)\/connect\b/);
    if (!match) return null;
    return `${root.location.origin}/version/${match[1]}/api/rooms/${match[2]}`;
  }

  async function fetchJson(path) {
    const base = getRoomApiBase();
    if (!base) throw new Error("Cannot resolve room API base from current WebSocket URL");
    const res = await root.fetch(`${base}${path}`, {
      credentials: "include",
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  function countNeedles(value, needle) {
    if (!needle) return 0;
    let count = 0;
    const seen = new Set();
    const walk = (node) => {
      if (!node || typeof node !== "object") return;
      if (seen.has(node)) return;
      seen.add(node);
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }
      for (const [key, child] of Object.entries(node)) {
        if (typeof child === "string" && child === needle) count++;
        if (typeof child === "number" && String(child) === needle) count++;
        if (key === needle) count++;
        walk(child);
      }
    };
    walk(value);
    return count;
  }

  async function snapshot(options = {}) {
    const id = String(options.id ?? config.target.id ?? "").trim();
    const result = {
      at: now(),
      id,
      apiBase: getRoomApiBase(),
      me: null,
      credits: null,
      idHits: null,
      error: null
    };
    try {
      const [me, credits] = await Promise.all([
        fetchJson("/me"),
        fetchJson("/me/credits").catch((error) => ({ __error: error.message }))
      ]);
      result.me = me;
      result.credits = credits;
      result.idHits = {
        me: countNeedles(me, id),
        credits: countNeedles(credits, id)
      };
    } catch (error) {
      result.error = error.message || String(error);
      warn("snapshot failed", result.error);
    }
    log("snapshot", result);
    return result;
  }

  function getOpenSockets() {
    const out = [];
    const roomSocket = getRoomConnectionSocket();
    if (roomSocket) out.push(roomSocket);
    for (const socket of trackedSockets) out.push(socket);
    return [...new Set(out)].filter((socket) => socket && socket.readyState === root.WebSocket.OPEN);
  }

  function installWebSocketTracker() {
    const NativeWebSocket = root.WebSocket;
    if (!NativeWebSocket || NativeWebSocket.__mgStockBuyerProbeWrapped) return;

    function WrappedWebSocket(...args) {
      const socket = new NativeWebSocket(...args);
      trackedSockets.add(socket);
      socket.addEventListener?.("close", () => trackedSockets.delete(socket), { once: true });
      return socket;
    }

    WrappedWebSocket.prototype = NativeWebSocket.prototype;
    Object.setPrototypeOf?.(WrappedWebSocket, NativeWebSocket);
    for (const key of ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]) {
      try {
        Object.defineProperty(WrappedWebSocket, key, { value: NativeWebSocket[key] });
      } catch {
      }
    }
    WrappedWebSocket.__mgStockBuyerProbeWrapped = true;
    WrappedWebSocket.__nativeWebSocket = NativeWebSocket;
    root.WebSocket = WrappedWebSocket;
    log("WebSocket tracker installed. It can only see sockets opened after install, plus MagicCircle_RoomConnection.currentWebSocket if exposed.");
  }

  function sendViaRoomConnection(payload) {
    const conn = getRoomConnection();
    if (!conn || typeof conn.sendMessage !== "function") {
      throw new Error("MagicCircle_RoomConnection.sendMessage is not available");
    }
    conn.sendMessage(payload);
    return "roomConnection";
  }

  function sendViaWebSocket(payload) {
    const sockets = getOpenSockets();
    if (!sockets.length) throw new Error("No open WebSocket found");
    sockets[0].send(JSON.stringify(payload));
    return "webSocket";
  }

  function send(payloadOrOptions = {}) {
    const method = payloadOrOptions.method || "auto";
    const payload = payloadOrOptions.payload
      ? clone(payloadOrOptions.payload)
      : payloadOrOptions.type
      ? (() => {
        const { method: _method, ...cleanPayload } = payloadOrOptions;
        return cleanPayload;
      })()
      : buildPayload(
        payloadOrOptions.kind ?? config.target.kind,
        payloadOrOptions.id ?? config.target.id,
        payloadOrOptions.variant ?? "stockBuyer"
      );
    const entry = {
      at: now(),
      dryRun: !!config.dryRun,
      method,
      payload: clone(payload)
    };

    if (config.dryRun) {
      sentLog.push(entry);
      log("DRY_RUN payload", entry);
      return entry;
    }
    assertLivePayload(payload);

    let usedMethod = "";
    if (method === "roomConnection") {
      usedMethod = sendViaRoomConnection(payload);
    } else if (method === "webSocket") {
      usedMethod = sendViaWebSocket(payload);
    } else {
      try {
        usedMethod = sendViaRoomConnection(payload);
      } catch (roomError) {
        warn("RoomConnection failed, trying WebSocket:", roomError.message);
        usedMethod = sendViaWebSocket(payload);
      }
    }

    entry.method = usedMethod;
    sentLog.push(entry);
    log("sent", entry);
    return entry;
  }

  function sleep(ms) {
    return new Promise((resolve) => root.setTimeout(resolve, ms));
  }

  async function run(options = {}) {
    const kind = options.kind ?? config.target.kind;
    const id = options.id ?? config.target.id;
    const only = options.only ? new Set([].concat(options.only)) : null;
    const list = cases(kind, id).filter((item) => !only || only.has(item.name));
    if (!list.length) throw new Error("No cases selected");
    log(`running ${list.length} case(s)`, {
      dryRun: config.dryRun,
      kind,
      id,
      cases: list.map((item) => item.name)
    });
    for (const item of list) {
      log(`case: ${item.name}`, item.note, item.payload);
      send({ payload: item.payload, method: options.method || "auto" });
      await sleep(options.delayMs ?? config.delayMs);
    }
    return sentLog.slice();
  }

  async function runWithSnapshot(options = {}) {
    const before = await snapshot(options);
    const sent = await run(options);
    await sleep(options.afterDelayMs ?? 1800);
    const after = await snapshot(options);
    const summary = {
      before,
      sent,
      after,
      changed: JSON.stringify(before.me) !== JSON.stringify(after.me) || JSON.stringify(before.credits) !== JSON.stringify(after.credits)
    };
    log("runWithSnapshot result", summary);
    return summary;
  }

  function setDryRun(value) {
    config.dryRun = value !== false ? true : false;
    log("dryRun =", config.dryRun);
    return config.dryRun;
  }

  function setTarget(kind, id) {
    const normalizedKind = normalizeKind(kind);
    if (!normalizedKind) throw new Error(`Unknown shop kind: ${kind}`);
    config.target.kind = normalizedKind;
    config.target.id = String(id || "").trim();
    log("target =", { ...config.target });
    return { ...config.target };
  }

  function status() {
    const conn = getRoomConnection();
    const roomSocket = getRoomConnectionSocket();
    const openSockets = getOpenSockets();
    const result = {
      version: VERSION,
      dryRun: config.dryRun,
      target: { ...config.target },
      hasRoomConnection: !!conn,
      hasRoomSendMessage: typeof conn?.sendMessage === "function",
      roomSocketReadyState: roomSocket?.readyState ?? null,
      openSocketCount: openSockets.length,
      sentCount: sentLog.length
    };
    log("status", result);
    return result;
  }

  function help() {
    const lines = [
      "MGStockBuyerProbe.status()",
      "MGStockBuyerProbe.setTarget('seed'|'egg'|'tool'|'decor', '<item-id>')",
      "MGStockBuyerProbe.cases()",
      "MGStockBuyerProbe.snapshot()",
      "MGStockBuyerProbe.startRecording()",
      "MGStockBuyerProbe.recorded()",
      "MGStockBuyerProbe.run()",
      "MGStockBuyerProbe.runWithSnapshot({ only: 'normal' })",
      "MGStockBuyerProbe.run({ only: 'stockBuyer' })",
      "MGStockBuyerProbe.setDryRun(false) // live purchase mode",
      "MGStockBuyerProbe.send({ kind: 'seed', id: '<species>', variant: 'stockBuyer' })"
    ];
    log("commands:\n" + lines.join("\n"));
    return lines;
  }

  installWebSocketTracker();

  const api = {
    version: VERSION,
    config,
    buildPayload,
    cases,
    help,
    log: sentLog,
    recorded,
    run,
    runWithSnapshot,
    send,
    setDryRun,
    setTarget,
    snapshot,
    startRecording,
    stopRecording,
    status
  };
  root.MGStockBuyerProbe = api;
  if (typeof window !== "undefined") window.MGStockBuyerProbe = api;

  log("ready. Default is dryRun=true, so no purchase is sent until MGStockBuyerProbe.setDryRun(false). Run MGStockBuyerProbe.help().");
  status();
})();
