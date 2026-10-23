import type { CartItem } from "../types";

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      "Não foi possível salvar no navegador. Verifique o armazenamento e tente novamente.",
    );
  }
}

export function readCart(): CartItem[] {
  const cart = readStorage<unknown>("pedegas:cart", []);
  if (!Array.isArray(cart)) return [];
  return cart.filter(
    (item): item is CartItem =>
      item &&
      typeof item.productId === "string" &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity > 0,
  );
}

// O token fica limitado à sessão desta aba, sem guardar senha no navegador.
export function getToken() {
  try {
    return sessionStorage.getItem("pedegas:token");
  } catch {
    return null;
  }
}
export function saveToken(token: string) {
  sessionStorage.setItem("pedegas:token", token);
}
export function removeToken() {
  sessionStorage.removeItem("pedegas:token");
}
