import type {
  Address,
  CartItem,
  OrderInput,
  PaymentMethod,
  Product,
} from "../types.ts";

export const currency = (value: number | string) =>
  Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const formatDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
export const digits = (value: string) => value.replace(/\D/g, "");

export function cartTotals(cart: CartItem[], products: Product[]) {
  const subtotal = roundMoney(
    cart.reduce((sum, item) => {
      const product = products.find((product) => product.id === item.productId);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0),
  );
  return {
    subtotal,
    total: subtotal,
  };
}

export function buildOrder(
  cart: CartItem[],
  products: Product[],
  address: Address,
  paymentMethod: PaymentMethod,
  observation?: string,
): OrderInput {
  if (!cart.length) throw new Error("Adicione produtos ao carrinho.");
  const items = cart.map((item) => {
    const product = products.find((product) => product.id === item.productId);
    if (!product || !Number.isSafeInteger(item.quantity) || item.quantity < 1)
      throw new Error("Revise os produtos do carrinho.");
    return {
      productName: product.title,
      productPrice: currency(product.price),
      productQuantity: item.quantity,
      total: roundMoney(product.price * item.quantity),
    };
  });
  if (
    !address.street.trim() ||
    !address.number.trim() ||
    !address.city.trim() ||
    !address.state.trim()
  )
    throw new Error("Complete seu endereço de entrega.");
  const totals = cartTotals(cart, products);
  const payload: OrderInput = {
    items,
    paymentMethod,
    subtotal: totals.subtotal,
    total: totals.total,
    deliveryStreet: address.street,
    deliveryNumber: address.number,
    deliveryCity: address.city,
    deliveryState: address.state,
    deliveryNeighborhood: address.neighborhood,
    deliveryBlock: address.block,
    deliveryLot: address.lot,
    deliveryComplement: address.complement,
  };
  if (observation?.trim()) payload.observation = observation.trim();
  return payload;
}

export function addressLabel(
  address: Pick<Address, "street" | "number" | "city" | "state">,
) {
  return `${address.street}, ${address.number} · ${address.city} / ${address.state}`;
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir. Tente novamente.";
}
