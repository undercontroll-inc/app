const fs = require("node:fs");
const path = require("node:path");
const jsonServer = require("json-server");

const PORT = Number(process.env.JSON_SERVER_PORT || 3001);
const MOCK_PASSWORD = "123456";
const seedFile = path.join(__dirname, "db.json");
const dbFile = path.join(__dirname, "db.runtime.json");

fs.copyFileSync(seedFile, dbFile);

const server = jsonServer.create();
const router = jsonServer.router(dbFile);
const middlewares = jsonServer.defaults({ logger: true });

function db() {
  return router.db;
}

function nextId(collection) {
  const items = db().get(collection).value() ?? [];
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function findUser(id) {
  return db()
    .get("users")
    .find({ id: Number(id) })
    .value();
}

function findComponent(id) {
  return db()
    .get("components")
    .find({ id: Number(id) })
    .value();
}

function publicUser(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

function toAppliance(item, fallbackId) {
  return {
    id: item.id ?? fallbackId,
    imageUrl: item.imageUrl ?? null,
    model: item.model || "",
    type: item.type || "",
    brand: item.brand || "",
    volt: item.volt || item.voltage || "127V",
    series: item.series || item.serial || "",
    laborValue: Number(item.laborValue) || 0,
    completedAt: item.completedAt ?? null,
  };
}

function expandParts(partsPayload = []) {
  return partsPayload
    .map((part) => {
      const component = findComponent(part.componentId || part.id);
      return component ? { ...component } : null;
    })
    .filter(Boolean);
}

function totals(appliances, parts, discount) {
  const laborTotal = appliances.reduce((sum, item) => sum + (Number(item.laborValue) || 0), 0);
  const partsTotal = parts.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const discountValue = Number(discount) || 0;
  return {
    laborTotal,
    partsTotal,
    discount: discountValue,
    totalValue: laborTotal + partsTotal - discountValue,
  };
}

function replaceDemands(orderId, partsPayload = []) {
  const remaining = (db().get("demands").value() ?? []).filter((demand) => demand.orderId !== Number(orderId));
  let id = remaining.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
  const created = partsPayload
    .filter((part) => part.componentId && Number(part.quantity) > 0)
    .map((part) => ({
      id: ++id,
      componentId: Number(part.componentId),
      orderId: Number(orderId),
      quantity: Number(part.quantity) || 1,
    }));
  db()
    .set("demands", [...remaining, ...created])
    .write();
}

server.use(middlewares);
server.use(jsonServer.bodyParser);

server.use((req, _res, next) => {
  const prefix = "/v1/api";
  if (req.url.startsWith(prefix)) {
    req.url = req.url.slice(prefix.length) || "/";
  }
  next();
});

server.post("/auth", (req, res) => {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  const password = String(req.body?.password || "");
  const user = (db().get("users").value() ?? []).find((item) => item.email.toLowerCase() === email);

  if (!user || password !== MOCK_PASSWORD) {
    return res.status(401).json({ message: "Credenciais inválidas" });
  }

  return res.json({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
    user: publicUser(user),
  });
});

server.post("/auth/refresh", (req, res) => {
  if (req.body?.refreshToken !== "mock-refresh-token") {
    return res.status(401).json({ message: "Refresh token inválido" });
  }
  return res.json({
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  });
});

server.get("/users", (req, res, next) => {
  if (req.query.type == null && req.query.hasEmail == null) {
    return next();
  }

  let users = db().get("users").value() ?? [];
  if (req.query.type) {
    users = users.filter((user) => user.userType === req.query.type);
  }
  if (req.query.hasEmail === "true") {
    users = users.filter((user) => Boolean(user.email));
  }
  return res.json(users.map(publicUser));
});

server.get("/components", (req, res, next) => {
  if (req.query.category == null && req.query.name == null) {
    return next();
  }

  let components = db().get("components").value() ?? [];
  if (req.query.category) {
    const category = String(req.query.category).toLowerCase();
    components = components.filter((item) => String(item.category || "").toLowerCase() === category);
  }
  if (req.query.name) {
    const name = String(req.query.name).toLowerCase();
    components = components.filter((item) => {
      const haystack = `${item.item || ""} ${item.description || ""} ${item.brand || ""}`.toLowerCase();
      return haystack.includes(name);
    });
  }
  return res.json(components);
});

server.get("/orders/:orderId/demands", (req, res) => {
  const orderId = Number(req.params.orderId);
  let demands = (db().get("demands").value() ?? []).filter((demand) => demand.orderId === orderId);
  if (req.query.componentId != null) {
    const componentId = Number(req.query.componentId);
    demands = demands.filter((demand) => demand.componentId === componentId);
  }
  return res.json(demands);
});

server.post("/orders/:orderId/demands", (req, res) => {
  const demand = {
    id: nextId("demands"),
    orderId: Number(req.params.orderId),
    componentId: Number(req.body?.componentPartId ?? req.body?.componentId),
    quantity: Number(req.body?.quantity) || 1,
  };
  db().get("demands").push(demand).write();
  return res.status(201).json(demand);
});

server.delete("/orders/:orderId/demands/:demandId", (req, res) => {
  db()
    .get("demands")
    .remove({ id: Number(req.params.demandId) })
    .write();
  return res.status(204).end();
});

server.delete("/orders/:orderId/demands", (req, res) => {
  const remaining = (db().get("demands").value() ?? []).filter(
    (demand) => demand.orderId !== Number(req.params.orderId),
  );
  db().set("demands", remaining).write();
  return res.status(204).end();
});

server.get("/orders/:orderId/items", (req, res) => {
  const order = db()
    .get("orders")
    .find({ id: Number(req.params.orderId) })
    .value();
  if (!order) return res.status(404).json({ message: "Ordem não encontrada" });
  return res.json(order.appliances ?? []);
});

server.get("/orders/:id", (req, res, next) => {
  if (Number.isNaN(Number(req.params.id))) return next();
  const order = db()
    .get("orders")
    .find({ id: Number(req.params.id) })
    .value();
  if (!order) return res.status(404).json({ message: "Ordem não encontrada" });
  return res.json({ data: order });
});

server.get("/orders", (req, res) => {
  const page = Number(req.query.page ?? 0);
  const size = Number(req.query.size ?? 50);
  let orders = db().get("orders").value() ?? [];
  if (req.query.userId != null) {
    const userId = Number(req.query.userId);
    orders = orders.filter((order) => order.user?.id === userId);
  }
  const start = page * size;
  const data = orders.slice(start, start + size);
  return res.json({
    data,
    totalElements: orders.length,
    totalPages: Math.max(1, Math.ceil(orders.length / size) || 1),
    page,
    size,
  });
});

server.post("/orders", (req, res) => {
  const body = req.body || {};
  const user = findUser(body.userId);
  if (!user) {
    return res.status(400).json({ message: "Cliente não encontrado" });
  }

  const id = nextId("orders");
  const appliances = (body.appliances ?? []).map((item, index) => toAppliance(item, index + 1));
  const parts = expandParts(body.parts);
  const money = totals(appliances, parts, body.discount);
  const order = {
    id,
    user: publicUser(user),
    appliances,
    parts,
    ...money,
    receivedAt: body.receivedAt || null,
    deadline: body.deadline || null,
    nf: body.nf || null,
    haveReturnGuarantee: Boolean(body.returnGuarantee),
    customerDescription: body.customerDescription || "",
    technicalDescription: body.technicalDescription || "",
    status: body.status || "PENDING",
    updatedAt: new Date().toISOString(),
  };

  db().get("orders").push(order).write();
  replaceDemands(id, body.parts);
  return res.status(201).json(order);
});

server.patch("/orders/:id", (req, res) => {
  const id = Number(req.params.id);
  const current = db().get("orders").find({ id }).value();
  if (!current) return res.status(404).json({ message: "Ordem não encontrada" });

  const body = req.body || {};
  const appliances = body.appliances
    ? body.appliances.map((item, index) => toAppliance(item, item.id ?? index + 1))
    : current.appliances;
  const parts = body.parts ? expandParts(body.parts) : current.parts;
  const money = totals(appliances, parts, body.discount ?? current.discount);
  const updated = {
    ...current,
    appliances,
    parts,
    ...money,
    status: body.status || current.status,
    customerDescription: body.customerDescription ?? current.customerDescription,
    technicalDescription: body.technicalDescription ?? current.technicalDescription,
    updatedAt: new Date().toISOString(),
  };

  db().get("orders").find({ id }).assign(updated).write();
  if (body.parts) replaceDemands(id, body.parts);
  return res.json(updated);
});

const INSIGHTS_STATES = ["READY", "STALE", "AWAITING_DATA", "GENERATING", "FAILED"];
const GENERATION_MS = Number(process.env.MOCK_INSIGHTS_GENERATION_MS || 10000);
let insightsState = INSIGHTS_STATES.includes(process.env.MOCK_INSIGHTS_STATE)
  ? process.env.MOCK_INSIGHTS_STATE
  : "READY";
let insightsGeneratedAt = new Date().toISOString();
let nextJobId = 1;
const busyConversations = new Set();

const insightsContent = {
  insights: [
    {
      id: "cand-1",
      type: "TENDENCIA_ALTA",
      text: "Air fryers subiram 6 posições no ranking de vendas do mês.",
      category: "MLB-AIRFRYER",
      categoryName: "Air Fryers",
      evidence: { view: "ranking", fields: { positionDelta: 6 } },
      confidence: "ALTA",
      repairRelation: "Equipamentos populares geram manutenção após a garantia.",
      suggestedAction: "Reforce o estoque de resistências e ventoinhas.",
    },
    {
      id: "cand-2",
      type: "ALERTA_PRECO",
      text: "Micro-ondas tiveram alta de 18% no preço mediano.",
      category: "MLB-MICRO",
      categoryName: "Micro-ondas",
      evidence: { view: "prices", fields: { variation: 0.18 } },
      confidence: "MEDIA",
      repairRelation: "Preços altos favorecem o conserto em vez da troca.",
      suggestedAction: "Divulgue o serviço de conserto de micro-ondas.",
    },
    {
      id: "cand-3",
      type: "OPORTUNIDADE_REPARO",
      text: "Lava-louças aparecem entre os mais vendidos e não são atendidos pela oficina.",
      category: "MLB-LAVALOUCA",
      categoryName: "Lava-louças",
      evidence: { view: "coverage", fields: {} },
      confidence: "BAIXA",
      repairRelation: null,
      suggestedAction: null,
    },
  ],
  risingProducts: [
    {
      name: "Air Fryer Mondial 4L",
      brand: "Mondial",
      model: "AF-30",
      category: "Air Fryers",
      rank: 1,
      positionDelta: 6,
      score: 0.92,
      medianPrice: 349.9,
      validPriceCount: 14,
      confidence: "ALTA",
      servedByClient: true,
    },
    {
      name: "Cafeteira Arno Gran Perfetta",
      brand: "Arno",
      model: null,
      category: "Cafeteiras",
      rank: 2,
      positionDelta: 3,
      score: 0.71,
      medianPrice: null,
      validPriceCount: 1,
      confidence: "BAIXA",
      servedByClient: false,
    },
  ],
  limitations: ["Poucos preços válidos para cafeteiras.", "Ranking considera apenas o Mercado Livre."],
};

function insightsPayload() {
  const base = {
    state: insightsState,
    requestedBucketKey: "2026-10",
    requestedMonth: "outubro de 2026",
    snapshotPublishedAt: null,
    availableBucketKey: null,
    availableMonth: null,
    comparisonBucketKey: null,
    generatedAt: null,
    failureReason: null,
    matchCoverage: { exact: 0, brandCategory: 0, category: 0, none: 0 },
    insights: [],
    risingProducts: [],
    limitations: [],
  };
  if (insightsState === "AWAITING_DATA") return base;
  const available = insightsState === "READY" ? "2026-10" : "2026-09";
  return {
    ...base,
    snapshotPublishedAt: "2026-10-01T03:00:00Z",
    availableBucketKey: available,
    availableMonth: available === "2026-10" ? "outubro de 2026" : "setembro de 2026",
    comparisonBucketKey: "2026-08",
    generatedAt: insightsGeneratedAt,
    failureReason: insightsState === "FAILED" ? "TIMEOUT" : null,
    matchCoverage: { exact: 12, brandCategory: 5, category: 3, none: 2 },
    ...insightsContent,
  };
}

server.get("/insights", (_req, res) => res.json(insightsPayload()));

server.post("/market/insights/jobs", (_req, res) => {
  if (insightsState === "AWAITING_DATA") {
    return res.status(409).json({ status: 409, code: "AWAITING_DATA", message: "No snapshot published yet" });
  }
  insightsState = "GENERATING";
  const job = {
    jobId: nextJobId++,
    snapshotId: 1,
    bucketKey: "2026-10",
    status: "PENDING",
    attemptCount: 0,
    nextRunAt: new Date().toISOString(),
    lastError: null,
  };
  setTimeout(() => {
    insightsState = "READY";
    insightsGeneratedAt = new Date().toISOString();
  }, GENERATION_MS);
  return res.status(202).json(job);
});

function sendEvent(res, name, payload) {
  res.write(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function mockReply(content) {
  const text = String(content || "");
  if (/erro/i.test(text)) return { kind: "error" };
  if (/parcial/i.test(text)) return { kind: "partial", answer: "Esta resposta foi cortada antes do fim" };
  return {
    kind: "done",
    answer: `Olá! Sou a **Ana** (modo mock). Você perguntou: _${text}_.\n\nHoje há ${
      (db().get("orders").value() ?? []).length
    } ordens de serviço cadastradas.`,
  };
}

const CONVERSATION_ID = /^[A-Za-z0-9_-]{1,64}$/;
const conversations = new Map();
let chatMessageSeq = 5000;

function titleFrom(text) {
  const line =
    String(text || "")
      .split(/\r?\n/)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .find(Boolean) || "";
  if (!line) return "Nova conversa";
  if (line.length <= 60) return line;
  const slice = line.slice(0, 60);
  const space = slice.lastIndexOf(" ");
  return `${(space >= 20 ? slice.slice(0, space) : slice).trimEnd()}…`;
}

function previewFrom(text) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 160 ? `${clean.slice(0, 159)}…` : clean;
}

function ensureConversation(conversationId, firstText, at = new Date()) {
  let conversation = conversations.get(conversationId);
  if (!conversation) {
    conversation = {
      conversationId,
      title: titleFrom(firstText),
      createdAt: at.toISOString(),
      lastMessageAt: at.toISOString(),
      messages: [],
      deleted: false,
    };
    conversations.set(conversationId, conversation);
  }
  return conversation;
}

function addChatMessage(conversation, role, content, state = "completed", reason = null, at = new Date()) {
  chatMessageSeq += 1;
  const message = { id: chatMessageSeq, role, content, state, reason, createdAt: at.toISOString() };
  conversation.messages.push(message);
  conversation.lastMessageAt = message.createdAt;
  return message;
}

function summaryOf(conversation) {
  const last = conversation.messages[conversation.messages.length - 1];
  return {
    conversationId: conversation.conversationId,
    title: conversation.title,
    preview: previewFrom(last?.content),
    messageCount: conversation.messages.length,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
  };
}

function seedConversations() {
  const day = 24 * 60 * 60 * 1000;
  const seeds = [
    {
      id: "app-seed-hoje",
      ago: 2 * 60 * 60 * 1000,
      q: "Quais ordens estão pendentes?",
      a: "Você tem **3 ordens pendentes**: #12, #15 e #18.",
    },
    {
      id: "app-seed-ontem",
      ago: day + 3600 * 1000,
      q: "Quanto faturei nos últimos 30 dias?",
      a: "Nos últimos 30 dias o faturamento foi de **R$ 8.420,00**.",
    },
    {
      id: "app-seed-semana",
      ago: 5 * day,
      q: "Qual peça mais usei este mês?",
      a: "A peça mais usada foi o **Capacitor 45uF** (6 unidades).",
    },
  ];
  seeds.forEach((seed) => {
    const start = new Date(Date.now() - seed.ago);
    const conversation = ensureConversation(seed.id, seed.q, start);
    for (let index = 0; index < 30; index += 1) {
      const at = new Date(start.getTime() + index * 60 * 1000);
      addChatMessage(
        conversation,
        index % 2 === 0 ? "user" : "assistant",
        index === 0 ? seed.q : index === 1 ? seed.a : `Mensagem ${index + 1} do histórico.`,
        "completed",
        null,
        at,
      );
    }
  });
}
seedConversations();

function encodeCursor(value) {
  return Buffer.from(String(value)).toString("base64url");
}

function decodeCursor(value) {
  try {
    return Buffer.from(String(value), "base64url").toString("utf8");
  } catch {
    return null;
  }
}

function liveConversation(req, res) {
  const conversation = conversations.get(req.params.id);
  if (!CONVERSATION_ID.test(req.params.id) || !conversation || conversation.deleted) {
    res.status(404).json({ status: 404, code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" });
    return null;
  }
  return conversation;
}

server.get("/chats/conversations", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const list = [...conversations.values()]
    .filter((item) => !item.deleted)
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  const offset = req.query.cursor ? Number(decodeCursor(req.query.cursor)) || 0 : 0;
  const page = list.slice(offset, offset + limit);
  res.set("Cache-Control", "no-store, private");
  res.json({
    items: page.map(summaryOf),
    nextCursor: offset + limit < list.length ? encodeCursor(offset + limit) : null,
  });
});

server.get("/chats/conversations/:id", (req, res) => {
  const conversation = liveConversation(req, res);
  if (conversation) res.json(summaryOf(conversation));
});

server.get("/chats/conversations/:id/messages", (req, res) => {
  const conversation = liveConversation(req, res);
  if (!conversation) return undefined;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 50);
  const total = conversation.messages.length;
  const before = req.query.cursor ? Number(decodeCursor(req.query.cursor)) : total;
  if (req.query.cursor && !Number.isFinite(before)) {
    return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Invalid cursor" });
  }
  const start = Math.max(before - limit, 0);
  const etag = `"${conversation.conversationId}-${total}-${req.query.cursor || "latest"}-${limit}"`;
  res.set({ ETag: etag, "Cache-Control": "no-cache, private" });
  if (req.headers["if-none-match"] === etag) return res.status(304).end();
  return res.json({
    conversationId: conversation.conversationId,
    items: conversation.messages.slice(start, before),
    nextCursor: start > 0 ? encodeCursor(start) : null,
  });
});

server.patch("/chats/conversations/:id", (req, res) => {
  const conversation = liveConversation(req, res);
  if (!conversation) return undefined;
  const title = String(req.body?.title || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title || title.length > 120) {
    return res.status(400).json({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      errors: [{ field: "title", message: "O título deve ter entre 1 e 120 caracteres" }],
    });
  }
  conversation.title = title;
  return res.json(summaryOf(conversation));
});

server.delete("/chats/conversations/:id", (req, res) => {
  const conversation = conversations.get(req.params.id);
  if (conversation) conversation.deleted = true;
  res.status(204).end();
});

server.post("/chats/messages/stream", (req, res) => {
  const content = String(req.body?.content || "").trim();
  const conversationId = req.body?.conversationId || "default";
  if (!content || !CONVERSATION_ID.test(conversationId)) {
    return res.status(400).json({ status: 400, message: "Conteúdo ou conversationId inválido" });
  }
  if (conversations.get(conversationId)?.deleted) {
    return res.status(404).json({ status: 404, code: "CONVERSATION_NOT_FOUND", message: "Conversation not found" });
  }
  if (busyConversations.has(conversationId)) {
    return res.status(409).json({ status: 409, code: "CHAT_CONVERSATION_BUSY", message: "Conversation busy" });
  }
  const conversation = ensureConversation(conversationId, content);
  const userMessage = addChatMessage(conversation, "user", content);

  busyConversations.add(conversationId);
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  const reply = mockReply(content);
  const words = (reply.answer || "").split(/(\s+)/).filter(Boolean);
  const timers = [];
  let closed = false;
  const finish = () => {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    busyConversations.delete(conversationId);
    res.end();
  };
  res.on("close", finish);

  sendEvent(res, "start", { conversationId, userMessageId: userMessage.id });
  sendEvent(res, "status", { phase: "generating" });
  res.write(": keepalive\n\n");

  words.forEach((word, index) => {
    timers.push(setTimeout(() => !closed && sendEvent(res, "delta", { content: word }), 40 * (index + 1)));
  });

  timers.push(
    setTimeout(
      () => {
        if (closed) return;
        if (reply.kind === "error") {
          sendEvent(res, "error", {
            state: "failed",
            code: "CHAT_TIMEOUT",
            message: "A Ana demorou demais",
            retryable: true,
          });
        } else if (reply.kind === "partial") {
          const stored = addChatMessage(conversation, "assistant", reply.answer, "partial", "max_tokens");
          sendEvent(res, "partial", {
            state: "partial",
            content: reply.answer,
            reason: "max_tokens",
            retryable: true,
            messageId: stored.id,
          });
        } else {
          const stored = addChatMessage(conversation, "assistant", reply.answer);
          sendEvent(res, "done", { state: "completed", content: reply.answer, messageId: stored.id });
        }
        finish();
      },
      40 * (words.length + 2),
    ),
  );
  return undefined;
});

server.post("/chats/messages", (req, res) => {
  const conversationId = req.body?.conversationId || "mock-conversation";
  const reply = mockReply(req.body?.content);
  if (reply.kind === "error") {
    return res.status(503).json({ status: 503, code: "CHAT_UNAVAILABLE", message: "Ana indisponível" });
  }
  return res.json({
    conversationId,
    content: reply.answer,
    state: reply.kind === "partial" ? "partial" : "completed",
    reason: reply.kind === "partial" ? "max_tokens" : null,
  });
});

const suggestions = [
  "Quais ordens estão pendentes?",
  "Qual peça mais usei este mês?",
  "Quanto faturei nos últimos 30 dias?",
  "Quais clientes são recorrentes?",
];

server.get("/chats/suggestions", (_req, res) => res.json({ suggestions: suggestions.slice(0, 3) }));
server.post("/chats/suggestions", (_req, res) => {
  const shuffled = [...suggestions].sort(() => Math.random() - 0.5);
  res.json({ suggestions: shuffled.slice(0, 3) });
});

server.post("/transcriptions", (req, res) => {
  const contentType = String(req.headers["content-type"] || "");
  if (!contentType.startsWith("multipart/form-data")) {
    return res.status(400).json({ status: 400, code: "TRANSCRIPTION_INVALID", message: "Audio file is required" });
  }
  let size = 0;
  let head = "";
  req.on("data", (chunk) => {
    size += chunk.length;
    if (head.length < 2048) head += chunk.toString("latin1");
  });
  req.on("end", () => {
    const declared = /name="audio"[\s\S]*?content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim().toLowerCase();
    if (!/name="audio"/.test(head) || size < 256) {
      return res.status(400).json({ status: 400, code: "TRANSCRIPTION_INVALID", message: "Audio file is empty" });
    }
    if (declared && !["audio/mp4", "audio/m4a", "audio/x-m4a", "audio/aac", "video/mp4"].includes(declared)) {
      return res.status(400).json({
        status: 400,
        code: "TRANSCRIPTION_INVALID",
        message: `Declared type ${declared} does not match the audio content (m4a)`,
      });
    }
    return res.json({ text: "Cliente relata que o aparelho parou de funcionar após uma queda de energia." });
  });
  return undefined;
});

function periodStart(period) {
  const days = { SEVEN_DAYS: 7, THIRTY_DAYS: 30, NINETY_DAYS: 90, YEAR: 365 }[period];
  if (!days) return null;
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function ordersInPeriod(period) {
  const start = periodStart(period);
  return (db().get("orders").value() ?? []).filter((order) => !start || String(order.receivedAt || "") >= start);
}

server.get("/dashboard/metrics", (req, res) => {
  const value = ordersInPeriod(req.query.period).reduce((sum, order) => sum + (Number(order.totalValue) || 0), 0);
  res.json({ value });
});

server.get("/dashboard/ongoing-orders", (req, res) => {
  const value = ordersInPeriod(req.query.period).filter((order) =>
    ["PENDING", "IN_ANALYSIS"].includes(order.status),
  ).length;
  res.json({ value });
});

server.get("/dashboard/average-order-price", (req, res) => {
  const orders = ordersInPeriod(req.query.period);
  const total = orders.reduce((sum, order) => sum + (Number(order.totalValue) || 0), 0);
  res.json({ value: orders.length ? total / orders.length : 0 });
});

server.get("/dashboard/average-repair-time", (_req, res) => res.json({ value: 52.5 }));

server.get("/dashboard/charts/top-appliances", (req, res) => {
  const counts = new Map();
  ordersInPeriod(req.query.period).forEach((order) => {
    (order.appliances ?? []).forEach((item) => {
      const key = `${item.type}|${item.brand}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  const appliances = [...counts.entries()]
    .map(([key, count]) => {
      const [type, brand] = key.split("|");
      return { type, brand, count };
    })
    .sort((a, b) => b.count - a.count);
  res.json({ appliances });
});

server.post("/components", (req, res) => {
  const body = req.body || {};
  const component = {
    id: nextId("components"),
    item: body.item || "",
    description: body.description || "",
    brand: body.brand || "",
    price: Number(body.price) || 0,
    quantity: Number(body.quantity) || 0,
    supplier: body.supplier || "",
    category: body.category || "",
  };
  db().get("components").push(component).write();
  return res.status(201).json(component);
});

server.put("/components/:id", (req, res) => {
  const id = Number(req.params.id);
  const current = findComponent(id);
  if (!current) return res.status(404).json({ status: 404, message: "Componente não encontrado" });
  const body = req.body || {};
  const updated = {
    ...current,
    item: body.item ?? current.item,
    description: body.description ?? current.description,
    brand: body.brand ?? current.brand,
    price: body.price != null ? Number(body.price) : current.price,
    supplier: body.supplier ?? current.supplier,
    category: body.category ?? current.category,
  };
  db().get("components").find({ id }).assign(updated).write();
  return res.json(updated);
});

const STOCK_IMPORT_PROCESSING_MS = Number(process.env.MOCK_STOCK_IMPORT_MS || 4000);
const stockImports = new Map();
let stockImportSeq = 100;
let stockImportItemSeq = 1000;

function candidate(componentId, score) {
  const component = findComponent(componentId);
  if (!component) return null;
  return {
    componentId: component.id,
    name: component.item,
    brand: component.brand || null,
    currentQuantity: component.quantity ?? 0,
    price: component.price ?? null,
    score,
  };
}

function importItem(lineNumber, fields, match) {
  stockImportItemSeq += 1;
  const candidates = (match.candidates || []).map(([id, score]) => candidate(id, score)).filter(Boolean);
  const total = fields.unitPrice != null ? Math.round(fields.quantity * fields.unitPrice * 100) / 100 : null;
  return {
    id: stockImportItemSeq,
    lineNumber,
    supplierCode: fields.supplierCode || null,
    description: fields.description,
    quantity: fields.quantity,
    unit: fields.unit,
    unitPrice: fields.unitPrice,
    total: fields.total ?? total,
    confidence: fields.confidence ?? 0.95,
    warnings: fields.warnings || [],
    match: {
      type: match.type,
      componentId: match.componentId ?? null,
      confidence: match.confidence ?? 0,
      candidates,
    },
    action: match.componentId ? "ADD_TO_EXISTING" : "CREATE_NEW",
    componentId: match.componentId ?? null,
    updatePrice: false,
    newComponent: null,
    result: null,
  };
}

function extractedItems() {
  return [
    importItem(
      1,
      {
        supplierCode: "EMB-FF85",
        description: "COMPRESSOR EMBRACO FF8.5HBK 1/4HP 127V",
        quantity: 2,
        unit: "UN",
        unitPrice: 398.9,
      },
      { type: "ALIAS", componentId: 10, confidence: 1, candidates: [[10, 1]] },
    ),
    importItem(
      2,
      {
        supplierCode: "R134-750",
        description: "GAS REFRIG R134A LATA 750G",
        quantity: 10,
        unit: "UN",
        unitPrice: 89.5,
      },
      { type: "FUZZY", componentId: 12, confidence: 0.91, candidates: [[12, 0.91]] },
    ),
    importItem(
      3,
      {
        supplierCode: "FS-15",
        description: "FILTRO SEC. 15G SOLD.",
        quantity: 6,
        unit: "PC",
        unitPrice: 34.9,
        confidence: 0.62,
        warnings: ["LOW_CONFIDENCE"],
      },
      {
        type: "FUZZY",
        componentId: null,
        confidence: 0.68,
        candidates: [
          [13, 0.68],
          [10, 0.21],
        ],
      },
    ),
    importItem(
      4,
      {
        supplierCode: "TC-14",
        description: "TUBO COBRE 1/4 FLEXIVEL",
        quantity: 2.5,
        unit: "M",
        unitPrice: 42,
        warnings: ["NON_INTEGER_QUANTITY"],
      },
      { type: "NONE", componentId: null, confidence: 0, candidates: [] },
    ),
    importItem(
      5,
      { supplierCode: "RC-TSV", description: "TERMOSTATO RC TSV0001-01", quantity: 3, unit: "UN", unitPrice: 57.8 },
      { type: "NONE", componentId: null, confidence: 0, candidates: [] },
    ),
  ];
}

function itemsSum(items) {
  return Math.round(items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) * 100) / 100;
}

function processingStage(entry) {
  const progress = (Date.now() - entry.startedAt) / STOCK_IMPORT_PROCESSING_MS;
  if (progress < 0.15) return "RECEIVED";
  return progress < 0.7 ? "EXTRACTING" : "MATCHING";
}

function refreshStockImport(entry) {
  if (entry.status !== "PROCESSING") {
    entry.stage = null;
    return entry;
  }
  if (Date.now() - entry.startedAt < STOCK_IMPORT_PROCESSING_MS) {
    entry.stage = processingStage(entry);
    return entry;
  }
  entry.stage = null;
  if (entry.shouldFail) {
    entry.status = "FAILED";
    entry.failureReason = "UNREADABLE";
    entry.failureMessage = "Imagem sem nitidez suficiente.";
    entry.shouldFail = false;
  } else {
    entry.status = "READY";
    entry.items = extractedItems();
    entry.itemsTotal = itemsSum(entry.items);
    entry.supplier = { name: "FrioSul Distribuidora", cnpj: "12345678000190" };
    entry.invoice = {
      number: "004512",
      series: "1",
      issuedAt: `${new Date().toISOString().slice(0, 10)}T00:00:00-03:00`,
      accessKey: "35261112345678000190550010000045121000045120",
      total: entry.itemsTotal,
    };
  }
  entry.updatedAt = new Date().toISOString();
  return entry;
}

function publicStockImport(entry) {
  const { startedAt, shouldFail, ...dto } = refreshStockImport(entry);
  return dto;
}

function stockImportOr404(req, res) {
  const entry = stockImports.get(Number(req.params.id));
  if (!entry || entry.status === "CANCELED") {
    res.status(404).json({ status: 404, code: "STOCK_IMPORT_NOT_FOUND", message: "Importação não encontrada" });
    return null;
  }
  return entry;
}

function invalidState(res, message) {
  return res.status(409).json({ status: 409, code: "STOCK_IMPORT_INVALID_STATE", message });
}

server.post("/stock-imports", (req, res) => {
  const contentType = String(req.headers["content-type"] || "");
  if (!contentType.startsWith("multipart/form-data")) {
    return res.status(400).json({ status: 400, code: "STOCK_IMPORT_INVALID", message: "File is required" });
  }
  let size = 0;
  let head = "";
  req.on("data", (chunk) => {
    size += chunk.length;
    if (head.length < 4096) head += chunk.toString("latin1");
  });
  req.on("end", () => {
    if (!/name="file"/.test(head) || size < 64) {
      return res.status(400).json({ status: 400, code: "STOCK_IMPORT_INVALID", message: "File is empty" });
    }
    if (size > 10 * 1024 * 1024) {
      return res.status(400).json({ status: 400, code: "STOCK_IMPORT_INVALID", message: "File exceeds 10MB" });
    }
    const fileName = /filename="([^"]*)"/.exec(head)?.[1] || null;
    const declared = /name="file"[\s\S]*?content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim().toLowerCase() || "";
    if (declared.includes("heic") || declared.includes("heif")) {
      return res
        .status(400)
        .json({ status: 400, code: "STOCK_IMPORT_INVALID", message: "Unsupported file type image/heic" });
    }
    const sourceType = declared.includes("pdf") ? "PDF" : declared.includes("xml") ? "NFE_XML" : "IMAGE";
    stockImportSeq += 1;
    const now = new Date().toISOString();
    const entry = {
      id: stockImportSeq,
      status: "PROCESSING",
      stage: "RECEIVED",
      sourceType,
      fileName,
      failureReason: null,
      failureMessage: null,
      supplier: { name: null, cnpj: null },
      invoice: { number: null, series: null, issuedAt: null, accessKey: null, total: null },
      itemsTotal: null,
      warnings: [],
      duplicateOfImportId: null,
      items: [],
      createdAt: now,
      updatedAt: now,
      confirmedAt: null,
      startedAt: Date.now(),
      shouldFail: /fail/i.test(fileName || ""),
    };
    const confirmedBefore = [...stockImports.values()].find((other) => other.status === "CONFIRMED");
    if (confirmedBefore) {
      entry.warnings = ["POSSIBLE_DUPLICATE"];
      entry.duplicateOfImportId = confirmedBefore.id;
    }
    stockImports.set(entry.id, entry);
    return res.status(202).json(publicStockImport(entry));
  });
  return undefined;
});

server.get("/stock-imports", (req, res) => {
  const status = req.query.status;
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const list = [...stockImports.values()]
    .map(refreshStockImport)
    .filter((entry) => entry.status !== "CANCELED" && (!status || entry.status === status))
    .sort((a, b) => b.id - a.id)
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      status: entry.status,
      stage: entry.stage ?? null,
      sourceType: entry.sourceType,
      supplierName: entry.supplier.name,
      invoiceNumber: entry.invoice.number,
      issuedAt: entry.invoice.issuedAt,
      total: entry.invoice.total,
      itemCount: entry.items.length,
      createdAt: entry.createdAt,
    }));
  res.json(list);
});

server.get("/stock-imports/:id", (req, res) => {
  const entry = stockImportOr404(req, res);
  if (entry) res.json(publicStockImport(entry));
});

function validateReviewedItems(items) {
  const errors = [];
  if (!items.some((item) => item.action !== "IGNORE")) {
    errors.push({ field: "items", message: "Inclua pelo menos um item" });
  }
  items.forEach((item, index) => {
    if (item.action === "IGNORE") return;
    if (!String(item.description || "").trim())
      errors.push({ field: `items[${index}].description`, message: "Descrição obrigatória" });
    if (!(Number(item.quantity) > 0) || !Number.isInteger(Number(item.quantity))) {
      errors.push({
        field: `items[${index}].quantity`,
        message: "Quantidade deve ser um número inteiro maior que zero",
      });
    }
    if (item.action === "ADD_TO_EXISTING" && item.componentId == null) {
      errors.push({ field: `items[${index}].componentId`, message: "Escolha o produto do estoque" });
    }
  });
  return errors;
}

function applyReview(entry, body) {
  const keepNonNull = (current, next) =>
    Object.fromEntries(Object.entries({ ...current, ...(next || {}) }).map(([k, v]) => [k, v ?? current[k] ?? null]));
  entry.supplier = keepNonNull(entry.supplier, body.supplier);
  entry.invoice = keepNonNull(entry.invoice, body.invoice);
  let nextLine = entry.items.reduce((max, item) => Math.max(max, item.lineNumber), 0);
  const previous = new Map(entry.items.map((item) => [item.id, item]));
  const reviewed = (body.items || []).map((item) => {
    const base = item.id != null ? previous.get(item.id) : null;
    stockImportItemSeq += base ? 0 : 1;
    nextLine += base ? 0 : 1;
    const unitPrice = item.unitPrice == null ? null : Number(item.unitPrice);
    return {
      ...(base || {
        id: stockImportItemSeq,
        lineNumber: nextLine,
        supplierCode: null,
        confidence: 1,
        warnings: [],
        match: { type: "NONE", componentId: null, confidence: 0, candidates: [] },
        result: null,
      }),
      description: item.description,
      quantity: Number(item.quantity),
      unit: item.unit ?? null,
      unitPrice,
      total: unitPrice != null ? Math.round(Number(item.quantity) * unitPrice * 100) / 100 : null,
      action: item.action,
      componentId: item.action === "ADD_TO_EXISTING" ? (item.componentId ?? null) : null,
      updatePrice: item.action === "ADD_TO_EXISTING" ? Boolean(item.updatePrice) : false,
      newComponent: item.action === "CREATE_NEW" ? (item.newComponent ?? null) : null,
    };
  });
  const sentIds = new Set(reviewed.map((item) => item.id));
  const omitted = entry.items
    .filter((item) => !sentIds.has(item.id))
    .map((item) => ({ ...item, action: "IGNORE", componentId: null, updatePrice: false, newComponent: null }));
  entry.items = [...reviewed, ...omitted].sort((a, b) => a.lineNumber - b.lineNumber);
  entry.itemsTotal = itemsSum(entry.items.filter((item) => item.action !== "IGNORE"));
  entry.updatedAt = new Date().toISOString();
}

server.put("/stock-imports/:id", (req, res) => {
  const entry = stockImportOr404(req, res);
  if (!entry) return undefined;
  refreshStockImport(entry);
  if (entry.status !== "READY") return invalidState(res, "Importação não está pronta para revisão");
  applyReview(entry, req.body || {});
  return res.json(publicStockImport(entry));
});

server.post("/stock-imports/:id/confirm", (req, res) => {
  const entry = stockImportOr404(req, res);
  if (!entry) return undefined;
  refreshStockImport(entry);
  if (entry.status !== "READY") return invalidState(res, "Importação já confirmada ou indisponível");
  const body = req.body || {};
  const errors = validateReviewedItems(body.items || []);
  if (errors.length) {
    return res.status(400).json({ status: 400, code: "VALIDATION_ERROR", message: "Dados inválidos", errors });
  }
  const missing = (body.items || []).find(
    (item) => item.action === "ADD_TO_EXISTING" && !findComponent(item.componentId),
  );
  if (missing) {
    return res.status(422).json({ status: 422, code: "COMPONENT_NOT_FOUND", message: "Componente não encontrado" });
  }
  applyReview(entry, body);
  entry.items = entry.items.map((item) => {
    if (item.action === "IGNORE") return item;
    if (item.action === "ADD_TO_EXISTING") {
      const component = findComponent(item.componentId);
      const previousQuantity = component.quantity ?? 0;
      const newQuantity = previousQuantity + item.quantity;
      const patch = {
        quantity: newQuantity,
        ...(item.updatePrice && item.unitPrice != null ? { price: item.unitPrice } : {}),
      };
      db().get("components").find({ id: component.id }).assign(patch).write();
      return { ...item, result: { componentId: component.id, created: false, previousQuantity, newQuantity } };
    }
    const created = {
      id: nextId("components"),
      item: item.newComponent?.name || item.description,
      description: item.newComponent?.description || item.description,
      brand: item.newComponent?.brand || "",
      price: item.unitPrice ?? 0,
      quantity: item.quantity,
      supplier: entry.supplier.name || "",
      category: item.newComponent?.category || "",
    };
    db().get("components").push(created).write();
    return {
      ...item,
      result: { componentId: created.id, created: true, previousQuantity: 0, newQuantity: item.quantity },
    };
  });
  entry.status = "CONFIRMED";
  entry.confirmedAt = new Date().toISOString();
  entry.updatedAt = entry.confirmedAt;
  return res.json(publicStockImport(entry));
});

server.post("/stock-imports/:id/retry", (req, res) => {
  const entry = stockImportOr404(req, res);
  if (!entry) return undefined;
  if (entry.status !== "FAILED") return invalidState(res, "Só é possível tentar de novo uma importação com falha");
  Object.assign(entry, {
    status: "PROCESSING",
    stage: "RECEIVED",
    failureReason: null,
    failureMessage: null,
    startedAt: Date.now(),
  });
  return res.status(202).json(publicStockImport(entry));
});

server.delete("/stock-imports/:id", (req, res) => {
  const entry = stockImports.get(Number(req.params.id));
  if (!entry)
    return res.status(404).json({ status: 404, code: "STOCK_IMPORT_NOT_FOUND", message: "Importação não encontrada" });
  if (entry.status === "CONFIRMED") return invalidState(res, "Importação já confirmada");
  entry.status = "CANCELED";
  return res.status(204).end();
});

server.use(router);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JSON Server em http://localhost:${PORT}/v1/api`);
  console.log("Login mock: admin@pelluci.com / 123456");
  console.log(`Insights mock: estado ${insightsState} (MOCK_INSIGHTS_STATE=${INSIGHTS_STATES.join("|")})`);
});
