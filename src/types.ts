export type UserRole = "customer" | "admin";
export type OrderStatus =
  "pending" | "confirmed" | "out_for_delivery" | "delivered" | "canceled";
export type PaymentMethod = "pix" | "card" | "cash";

export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  role: UserRole;
}

export interface UserInput {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password: string;
}

export interface AddressInput {
  name: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  block: string;
  lot: string;
  complement: string;
  country: string;
  default: boolean;
}

export interface Address extends AddressInput {
  id: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  type: "gas" | "water";
  badge: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface OrderItemInput {
  productName: string;
  productPrice: string;
  productQuantity: number;
  total: number;
}

export interface OrderInput {
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  observation?: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryNumber: string;
  deliveryNeighborhood?: string;
  deliveryBlock?: string;
  deliveryLot?: string;
  deliveryComplement?: string;
  items: OrderItemInput[];
}

export interface Order extends OrderInput {
  id: string;
  userId: string;
  user: User;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderNotice {
  id: string;
  orderId: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
}
