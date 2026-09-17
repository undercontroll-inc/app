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
  return db().get("users").find({ id: Number(id) }).value();
}

function findComponent(id) {
  return db().get("components").find({ id: Number(id) }).value();
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
  db().set("demands", [...remaining, ...created]).write();
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
  const email = String(req.body?.email || "").trim().toLowerCase();
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
  db().get("demands").remove({ id: Number(req.params.demandId) }).write();
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
  const order = db().get("orders").find({ id: Number(req.params.orderId) }).value();
  if (!order) return res.status(404).json({ message: "Ordem não encontrada" });
  return res.json(order.appliances ?? []);
});

server.get("/orders/:id", (req, res, next) => {
  if (Number.isNaN(Number(req.params.id))) return next();
  const order = db().get("orders").find({ id: Number(req.params.id) }).value();
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

server.use(router);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JSON Server em http://localhost:${PORT}/v1/api`);
  console.log("Login mock: admin@pelluci.com / 123456");
});
