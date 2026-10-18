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

server.post("/chats/messages/stream", (req, res) => {
  const content = String(req.body?.content || "").trim();
  const conversationId = req.body?.conversationId || "mock-conversation";
  if (!content || !CONVERSATION_ID.test(conversationId)) {
    return res.status(400).json({ status: 400, message: "Conteúdo ou conversationId inválido" });
  }
  if (busyConversations.has(conversationId)) {
    return res.status(409).json({ status: 409, code: "CHAT_CONVERSATION_BUSY", message: "Conversation busy" });
  }

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

  sendEvent(res, "start", { conversationId });
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
          sendEvent(res, "partial", { state: "partial", content: reply.answer, reason: "max_tokens", retryable: true });
        } else {
          sendEvent(res, "done", { state: "completed", content: reply.answer });
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

server.use(router);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JSON Server em http://localhost:${PORT}/v1/api`);
  console.log("Login mock: admin@pelluci.com / 123456");
  console.log(`Insights mock: estado ${insightsState} (MOCK_INSIGHTS_STATE=${INSIGHTS_STATES.join("|")})`);
});
