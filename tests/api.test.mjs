import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { createServer as createViteServer } from "vite";

// Verifica as chamadas reais do cliente HTTP sem acessar a API de produção.
test("serviços web respeitam autenticação, rotas e erros da API", async () => {
  const received = [];
  let nextError = null;
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    received.push({
      path: req.url,
      method: req.method,
      authorization: req.headers.authorization,
      body: raw ? JSON.parse(raw) : undefined,
    });
    res.setHeader("Content-Type", "application/json");
    if (nextError) {
      res.statusCode = nextError.status;
      res.end(JSON.stringify({ message: nextError.message }));
      nextError = null;
      return;
    }
    res.end(
      JSON.stringify(
        req.url === "/auth/login"
          ? { token: "isolated-token", role: "customer" }
          : { id: "test-id" },
      ),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const previousUrl = process.env.VITE_API_URL;
  process.env.VITE_API_URL = `http://127.0.0.1:${server.address().port}`;
  const session = new Map();
  const previousStorage = globalThis.sessionStorage;
  const previousWindow = globalThis.window;
  globalThis.sessionStorage = { getItem: (key) => session.get(key) || null };
  globalThis.window = new EventTarget();
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
    mode: "test",
  });
  try {
    const {
      AuthService,
      UserService,
      AddressesService,
      OrderService,
      ApiError,
    } = await vite.ssrLoadModule("/src/services/api.ts");
    session.set("pedegas:token", "existing-token");
    assert.equal(
      (await AuthService.login("cliente@teste.local", "test-password")).token,
      "isolated-token",
    );
    assert.deepEqual(received.at(-1), {
      path: "/auth/login",
      method: "POST",
      authorization: undefined,
      body: { email: "cliente@teste.local", password: "test-password" },
    });
    await UserService.create({
      name: "Teste",
      email: "cliente@teste.local",
      cpf: "00000000000",
      phone: "00000000000",
      password: "test-password",
      role: "admin",
    });
    assert.equal(received.at(-1).body.role, "customer");
    assert.equal(received.at(-1).authorization, undefined);
    await UserService.me();
    assert.equal(received.at(-1).path, "/users/me");
    assert.equal(received.at(-1).authorization, "Bearer existing-token");
    await AddressesService.setDefault("id/with/slash");
    assert.equal(received.at(-1).path, "/addresses/id%2Fwith%2Fslash/default");
    assert.equal(received.at(-1).method, "PATCH");
    await AddressesService.clearDefault();
    assert.equal(received.at(-1).path, "/addresses/default/clear");
    await AddressesService.delete("address-1");
    assert.equal(received.at(-1).method, "DELETE");
    await OrderService.create({
      paymentMethod: "cash",
      total: 115,
      subtotal: 115,
      items: [],
    });
    assert.equal(received.at(-1).path, "/orders");
    assert.equal(received.at(-1).body.paymentMethod, "cash");
    await OrderService.status("order-1", "out_for_delivery");
    assert.deepEqual(received.at(-1).body, { status: "out_for_delivery" });
    assert.equal(received.at(-1).path, "/orders/order-1/status");
    await OrderService.cancel("order-1");
    assert.equal(received.at(-1).path, "/orders/order-1/cancel");
    nextError = {
      status: 400,
      message: ["Endereço inválido", "Confira o CEP"],
    };
    await assert.rejects(
      AddressesService.list(),
      (error) =>
        error instanceof ApiError &&
        error.status === 400 &&
        error.message === "Endereço inválido Confira o CEP",
    );
    let expired = false;
    window.addEventListener("pedegas:unauthorized", () => {
      expired = true;
    });
    nextError = { status: 401, message: "Unauthorized" };
    await assert.rejects(OrderService.list(), /Sua sessão expirou/);
    assert.equal(expired, true);
    expired = false;
    nextError = { status: 401, message: "Unauthorized" };
    await assert.rejects(
      AuthService.login("cliente@teste.local", "wrong"),
      /E-mail ou senha incorretos/,
    );
    assert.equal(expired, false);
  } finally {
    await vite.close();
    await new Promise((resolve) => server.close(resolve));
    if (previousUrl === undefined) delete process.env.VITE_API_URL;
    else process.env.VITE_API_URL = previousUrl;
    globalThis.sessionStorage = previousStorage;
    globalThis.window = previousWindow;
  }
});
