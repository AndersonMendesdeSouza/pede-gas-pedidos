import gas13 from "../assets/app/gas/gas13.png";
import gas45 from "../assets/app/gas/gas45.png";
import goya from "../assets/app/agua/goya.png";
import nativa from "../assets/app/agua/nativa.png";
import type { Product, OrderStatus, PaymentMethod } from "../types";

// Catálogo e preços preservados do MainScreen do aplicativo.
export const products: Product[] = [
  {
    id: "p13",
    title: "Botijão de Gás P13",
    description: "Ideal para uso residencial. Entrega rápida na sua região.",
    price: 115,
    image: gas13,
    type: "gas",
    badge: "Mais pedido",
  },
  {
    id: "p45",
    title: "Botijão de Gás P45",
    description: "Ideal para uso residencial. Entrega rápida na sua região.",
    price: 115,
    image: gas45,
    type: "gas",
    badge: "Mais pedido",
  },
  {
    id: "water-goya",
    title: "Água Mineral Goya 20L",
    description: "Galão retornável com água mineral natural.",
    price: 18,
    image: goya,
    type: "water",
    badge: "20L retornável",
  },
  {
    id: "water-nativa",
    title: "Água Mineral Nativa 20L",
    description: "Galão retornável com água mineral natural.",
    price: 18,
    image: nativa,
    type: "water",
    badge: "Mineral natural",
  },
];

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  out_for_delivery: "Em entrega",
  delivered: "Entregue",
  canceled: "Cancelado",
};
export const paymentLabels: Record<PaymentMethod, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};
