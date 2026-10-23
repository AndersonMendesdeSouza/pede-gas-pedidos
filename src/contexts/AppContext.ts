import { createContext, useContext } from "react";
import type { Address, CartItem, Order, OrderNotice, User } from "../types";

export interface AppState {
  user: User | null;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  reloadUser: () => Promise<void>;
  cart: CartItem[];
  setQuantity: (productId: string, quantity: number) => boolean;
  clearCart: () => void;
  addresses: Address[];
  addressesLoading: boolean;
  addressesError: string;
  reloadAddresses: () => Promise<void>;
  orders: Order[];
  ordersLoading: boolean;
  ordersError: string;
  reloadOrders: () => Promise<void>;
  notices: OrderNotice[];
  markNoticesRead: (id?: string) => void;
  notify: (message: string) => void;
  soundEnabled: boolean;
  toggleSound: () => void;
}

export const AppContext = createContext<AppState | null>(null);
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider não encontrado.");
  return context;
}
