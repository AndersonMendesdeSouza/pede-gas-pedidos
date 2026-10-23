import gas13 from "../assets/app/gas/gas13.png";
import gas45 from "../assets/app/gas/gas45.png";
import goya from "../assets/app/agua/goya.png";
import nativa from "../assets/app/agua/nativa.png";
import type { Product, Coupon, OrderStatus, PaymentMethod } from "../types";

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

// As regras e o progresso são estáticos no app original; não há API de fidelidade.
export const coupons: Coupon[] = [
  {
    id: "first-order",
    code: "PRIMEIRA10",
    title: "Primeira compra",
    description: "Ganhe 10% de desconto no primeiro pedido.",
    rule: "Liberado para novos clientes",
    status: "available",
    discount: 10,
    discountLabel: "10%",
    expiresAt: "Válido por 7 dias",
    progress: 1,
  },
  {
    id: "two-gas-month",
    code: "GAS2MES",
    title: "2 botijões no mês",
    description: "Compre 2 botijões no mês e libere seu desconto.",
    rule: "Progresso: 1 de 2 botijões",
    status: "available",
    discount: 12,
    discountLabel: "12%",
    expiresAt: "Renova todo mês",
    progress: 1,
  },
  {
    id: "water-combo",
    code: "AGUA20",
    title: "Combo água mineral",
    description: "Peça 3 galões de água e ganhe 20% no próximo galão.",
    rule: "Progresso: 2 de 3 galões",
    status: "progress",
    discount: 20,
    discountLabel: "20%",
    expiresAt: "Válido neste mês",
    progress: 0.66,
  },
  {
    id: "loyalty",
    code: "VIZINHO15",
    title: "Cliente fiel",
    description: "Faça 5 pedidos e ganhe 15% de desconto.",
    rule: "Faltam 2 pedidos",
    status: "locked",
    discount: 15,
    discountLabel: "15%",
    expiresAt: "Desbloqueio automático",
    progress: 0.6,
  },
  {
    id: "weekend",
    code: "FIMDESEMANA",
    title: "Entrega de fim de semana",
    description: "Desconto na taxa de entrega para pedidos no sábado.",
    rule: "Libera após 1 pedido entregue na semana",
    status: "locked",
    discount: 0,
    discountLabel: "Frete grátis",
    expiresAt: "Todo sábado",
    progress: 0.25,
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
