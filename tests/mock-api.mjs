// Servidor isolado para verificação local. Não conecta à API nem ao banco real.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const customer = {
  id: "local-customer",
  name: "Cliente de teste",
  email: "cliente@teste.local",
  cpf: "00000000000",
  phone: "00000000000",
  role: "customer",
};
const admin = {
  ...customer,
  id: "local-admin",
  name: "Administrador de teste",
  email: "admin@teste.local",
  role: "admin",
};
let addresses = [];
let orders = [];

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname.replace(/\/$/, "");
  let body = "";
  for await (const part of req) body += part;
  let input;
  try {
    input = body ? JSON.parse(body) : {};
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  const user =
    req.headers.authorization === "Bearer local-admin" ? admin : customer;
  const reply = (data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (path === "/auth/login" && req.method === "POST") {
    if (
      !["cliente@teste.local", "admin@teste.local"].includes(input.email) ||
      input.password !== "Teste123"
    )
      return reply({ message: "E-mail ou senha incorretos." }, 401);
    const role = input.email.startsWith("admin") ? "admin" : "customer";
    return reply({ token: `local-${role}`, role });
  }
  if (!req.headers.authorization)
    return reply({ message: "Sessão necessária" }, 401);
  if (path === "/users/me") return reply(user);
  if (path === `/users/${user.id}` && req.method === "PATCH") {
    Object.assign(user, input);
    return reply(user);
  }
  if (path === "/addresses" && req.method === "GET") return reply(addresses);
  if (path === "/addresses" && req.method === "POST") {
    if (input.default)
      addresses.forEach((address) => {
        address.default = false;
      });
    const address = { ...input, id: randomUUID() };
    addresses.push(address);
    return reply(address, 201);
  }
  if (path === "/addresses/default/clear") {
    addresses.forEach((address) => {
      address.default = false;
    });
    return reply(addresses);
  }
  if (path.startsWith("/addresses/")) {
    const id = path.split("/")[2];
    const address = addresses.find((address) => address.id === id);
    if (!address) return reply({ message: "Endereço não encontrado" }, 404);
    if (req.method === "DELETE") {
      addresses = addresses.filter((address) => address.id !== id);
      return reply({ message: "Excluído" });
    }
    if (path.endsWith("/default")) {
      addresses.forEach((address) => {
        address.default = address.id === id;
      });
      return reply(address);
    }
    Object.assign(address, input);
    return reply(address);
  }
  if (path === "/orders" && req.method === "POST") {
    const order = {
      ...input,
      id: randomUUID(),
      userId: user.id,
      user: { ...user },
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    return reply(order, 201);
  }
  if (path === "/orders" && req.method === "GET") return reply(orders);
  if (path.startsWith("/orders/")) {
    const order = orders.find((order) => order.id === path.split("/")[2]);
    if (!order) return reply({ message: "Pedido não encontrado" }, 404);
    if (path.endsWith("/status")) {
      if (user.role !== "admin")
        return reply({ message: "Sem permissão" }, 403);
      order.status = input.status;
      order.updatedAt = new Date().toISOString();
    }
    if (path.endsWith("/cancel")) {
      order.status = "canceled";
      order.updatedAt = new Date().toISOString();
    }
    return reply(order);
  }
  reply({ message: "Rota de teste não disponível" }, 404);
});
server.listen(4318, "127.0.0.1", () =>
  console.log("API de teste isolada em http://127.0.0.1:4318"),
);
