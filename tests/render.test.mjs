import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

// Complementa os testes de contrato; não substitui a inspeção visual no navegador.
test("telas renderizam dados de cliente, administrador e estados vazios", async () => {
  const vite = await createServer({
    plugins: [
      {
        name: "layout-test-route",
        enforce: "pre",
        transform(source, id) {
          if (id.endsWith("/components/Layout.tsx"))
            return source.replace(
              '"../services/navigation"',
              '"virtual:layout-test-route"',
            );
        },
        resolveId(source) {
          if (source === "virtual:layout-test-route")
            return "\0layout-test-route";
        },
        load(id) {
          if (id === "\0layout-test-route")
            return 'export const useRoute = () => "enderecos";';
        },
      },
    ],
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: "custom",
    mode: "test",
  });
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    const { AppContext } = await vite.ssrLoadModule(
      "/src/contexts/AppContext.ts",
    );
    const user = {
      id: "local-customer",
      name: "Cliente de teste",
      email: "cliente@teste.local",
      phone: "00000000000",
      cpf: "00000000000",
      role: "customer",
    };
    const noop = () => {};
    const state = {
      user,
      authLoading: false,
      cart: [],
      addresses: [],
      orders: [],
      notices: [],
      addressesLoading: false,
      ordersLoading: false,
      addressesError: "",
      ordersError: "",
      login: noop,
      logout: noop,
      reloadUser: noop,
      setQuantity: noop,
      clearCart: noop,
      reloadAddresses: noop,
      reloadOrders: noop,
      markNoticesRead: noop,
      notify: noop,
      soundEnabled: false,
      toggleSound: noop,
    };
    const render = (component, value = state, props = {}) =>
      renderToStaticMarkup(
        createElement(
          AppContext.Provider,
          { value },
          createElement(component, props),
        ),
      );
    const Layout = (await vite.ssrLoadModule("/src/components/Layout.tsx"))
      .default;
    const layout = render(Layout);
    for (const className of ["desktop-nav", "mobile-nav"]) {
      const navigation = layout.match(
        new RegExp(`<nav class="${className}"[^>]*>(.*?)</nav>`),
      )?.[1];
      assert.ok(navigation, className);
      assert.deepEqual(
        [...navigation.matchAll(/href="#\/(.*?)"/g)].map((match) => match[1]),
        ["inicio", "pedidos", "enderecos", "perfil"],
      );
      assert.match(
        navigation,
        /href="#\/enderecos" class="active" aria-current="page"/,
      );
      assert.ok(navigation.includes("Endereços"));
    }
    const Home = (await vite.ssrLoadModule("/src/pages/Home.tsx")).default;
    assert.match(render(Home), /Água Mineral Goya 20L/);
    assert.match(render(Home), /Botijão de Gás P45/);
    const Cart = (await vite.ssrLoadModule("/src/pages/Cart.tsx")).default;
    assert.match(render(Cart), /Seu carrinho está esperando/);
    const cart = render(Cart, {
      ...state,
      cart: [{ productId: "p13", quantity: 2 }],
    });
    assert.match(cart, /230,00/);
    assert.match(cart, /Continuar/);
    const Addresses = (await vite.ssrLoadModule("/src/pages/Addresses.tsx"))
      .default;
    assert.match(render(Addresses), /Cadastre seu primeiro endereço/);
    assert.match(render(Addresses, { ...state, user: null }), /Entre na sua conta/);
    const addresses = render(Addresses, {
      ...state,
      addresses: [
        {
          id: "default-address",
          name: "Casa",
          street: "Rua principal",
          number: "10",
          city: "Buriti Alegre",
          state: "GO",
          default: true,
        },
        {
          id: "other-address",
          name: "Trabalho",
          street: "Rua de teste",
          number: "20",
          city: "Buriti Alegre",
          state: "GO",
          default: false,
        },
      ],
    });
    for (const text of [
      "Meus endereços",
      "Novo endereço",
      "Casa",
      "Trabalho",
      "Entrega padrão",
      "Entregar aqui",
      "Desmarcar padrão",
      "Editar",
      "Excluir",
    ]) assert.ok(addresses.includes(text), text);
    const { default: Profile, EditProfile } = await vite.ssrLoadModule(
      "/src/pages/Profile.tsx",
    );
    assert.match(render(Profile), /cliente@teste.local/);
    assert.match(
      render(Profile, { ...state, user: null }),
      /Entre na sua conta/,
    );
    assert.match(render(EditProfile), /Salvar alterações/);
    const Orders = (await vite.ssrLoadModule("/src/pages/Orders.tsx")).default;
    assert.match(render(Orders), /Nenhum pedido por aqui/);
    const order = {
      id: "test-order",
      status: "pending",
      user,
      userId: user.id,
      paymentMethod: "pix",
      subtotal: 115,
      total: 115,
      deliveryStreet: "Rua de teste",
      deliveryNumber: "10",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [{ productName: "Gás de teste", productQuantity: 1, total: 115 }],
    };
    assert.doesNotMatch(
      render(Orders, { ...state, orders: [order] }),
      /Aceitar pedido/,
    );
    assert.match(
      render(Orders, {
        ...state,
        user: { ...user, role: "admin" },
        orders: [order],
      }),
      /Aceitar pedido/,
    );
    const Admin = (await vite.ssrLoadModule("/src/pages/Admin.tsx")).default;
    assert.match(
      render(Admin, { ...state, user: { ...user, role: "admin" } }),
      /Nenhum pedido neste período/,
    );
    const Auth = (await vite.ssrLoadModule("/src/pages/Auth.tsx")).default;
    assert.match(
      render(Auth, { ...state, user: null }, { mode: "cadastro" }),
      /Confirmar senha/,
    );
    assert.match(
      render(Auth, { ...state, user: null }, { mode: "recuperar" }),
      /Solicitar recuperação/,
    );
    const Notifications = (
      await vite.ssrLoadModule("/src/pages/Notifications.tsx")
    ).default;
    assert.match(render(Notifications), /Tudo tranquilo por aqui/);
  } finally {
    globalThis.window = previousWindow;
    await vite.close();
  }
});
