import assert from "node:assert/strict";
import test from "node:test";
import { buildOrder, cartTotals } from "../src/utils/order.ts";
import type { Address, Coupon, Product } from "../src/types.ts";

const products: Product[] = [
  {
    id: "gas",
    title: "Gás",
    price: 115,
    description: "",
    image: "",
    type: "gas",
    badge: "",
  },
  {
    id: "water",
    title: "Água",
    price: 18,
    description: "",
    image: "",
    type: "water",
    badge: "",
  },
];
const coupon: Coupon = {
  id: "first",
  code: "PRIMEIRA10",
  title: "",
  description: "",
  rule: "",
  status: "available",
  discount: 10,
  discountLabel: "10%",
  expiresAt: "",
  progress: 1,
};
const address: Address = {
  id: "address-1",
  name: "Casa",
  street: "Rua de teste",
  number: "10",
  neighborhood: "Centro",
  city: "Buriti Alegre",
  state: "GO",
  zipCode: "75660000",
  block: "2",
  lot: "3",
  complement: "Portão azul",
  country: "Brasil",
  default: true,
};

test("calcula quantidades, subtotal e desconto em centavos", () => {
  assert.deepEqual(
    cartTotals(
      [
        { productId: "gas", quantity: 2 },
        { productId: "water", quantity: 3 },
      ],
      products,
      coupon,
    ),
    { subtotal: 284, discount: 28.4, total: 255.6 },
  );
});
test("não aplica cupom bloqueado ou em progresso", () => {
  for (const status of ["locked", "progress"] as const) {
    assert.deepEqual(
      cartTotals([{ productId: "gas", quantity: 1 }], products, {
        ...coupon,
        status,
      }),
      { subtotal: 115, discount: 0, total: 115 },
    );
  }
});
test("monta o contrato da API com endereço completo e desconto", () => {
  const order = buildOrder(
    [{ productId: "gas", quantity: 2 }],
    products,
    address,
    "pix",
    coupon,
    "  Avisar na chegada  ",
  );
  assert.equal(order.subtotal, 230);
  assert.equal(order.total, 207);
  assert.equal(order.discountAmount, 23);
  assert.equal(order.couponCode, "PRIMEIRA10");
  assert.equal(order.deliveryStreet, address.street);
  assert.equal(order.deliveryBlock, "2");
  assert.equal(order.deliveryLot, "3");
  assert.equal(order.deliveryComplement, "Portão azul");
  assert.equal(order.observation, "Avisar na chegada");
  assert.equal(order.paymentMethod, "pix");
  assert.deepEqual(order.items, [
    {
      productName: "Gás",
      productPrice: "R$ 115,00",
      productQuantity: 2,
      total: 230,
    },
  ]);
  assert.equal("id" in order, false);
  assert.equal("userId" in order, false);
});
test("envia todas as formas de pagamento e omite cupom quando não aplicado", () => {
  for (const method of ["pix", "card", "cash"] as const) {
    const order = buildOrder(
      [{ productId: "water", quantity: 1 }],
      products,
      address,
      method,
    );
    assert.equal(order.paymentMethod, method);
    assert.equal(order.total, 18);
    assert.equal("couponCode" in order, false);
    assert.equal("discountAmount" in order, false);
  }
});
test("rejeita carrinho vazio, produto inexistente e quantidades inválidas", () => {
  assert.throws(() => buildOrder([], products, address, "pix"), /Adicione/);
  assert.throws(
    () =>
      buildOrder(
        [{ productId: "unknown", quantity: 1 }],
        products,
        address,
        "pix",
      ),
    /Revise/,
  );
  for (const quantity of [0, -1, 1.5, NaN, Infinity])
    assert.throws(
      () =>
        buildOrder([{ productId: "gas", quantity }], products, address, "pix"),
      /Revise/,
    );
});
test("impede pedido sem endereço completo", () => {
  for (const key of ["street", "number", "city", "state"])
    assert.throws(
      () =>
        buildOrder(
          [{ productId: "gas", quantity: 1 }],
          products,
          { ...address, [key]: " " },
          "pix",
        ),
      /endereço/,
    );
});
