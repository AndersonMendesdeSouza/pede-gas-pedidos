import type {
  Address,
  AddressInput,
  Order,
  OrderInput,
  OrderStatus,
  User,
  UserInput,
  UserRole,
} from "../types";
import { getToken } from "./storage";

// No desenvolvimento, o proxy do Vite evita depender do CORS da API publicada.
// const baseUrl = (
//   import.meta.env.VITE_API_URL ||
//   // (import.meta.env.DEV ? "/api" : "https://pede-gas-api.onrender.com")
//   (import.meta.env.DEV ? "/api" : "http://localhost:3000")
// ).replace(/\/$/, "");

// const baseUrl = "http://localhost:3000";
const baseUrl = "https://pede-gas-api.onrender.com";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (authenticated && token) headers.Authorization = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
    );
  }
  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    /* A API também pode responder texto. */
  }
  if (!response.ok) {
    if (response.status === 401 && authenticated && getToken() === token)
      window.dispatchEvent(new Event("pedegas:unauthorized"));
    let message = "Não foi possível concluir a operação.";
    if (data && typeof data === "object" && "message" in data) {
      const detail = data.message;
      if (typeof detail === "string") message = detail;
      if (Array.isArray(detail)) message = detail.join(" ");
    }
    if (response.status === 401)
      message = authenticated
        ? "Sua sessão expirou. Entre novamente."
        : "E-mail ou senha incorretos.";
    throw new ApiError(message, response.status);
  }
  return data as T;
}

export const AuthService = {
  login: (email: string, password: string) =>
    request<{ token: string; role: UserRole }>(
      "/auth/login",
      "POST",
      { email, password },
      false,
    ),
};
export const UserService = {
  create: (input: UserInput) =>
    request<User>("/users", "POST", { ...input, role: "customer" }, false),
  me: () => request<User>("/users/me"),
  update: (id: string, input: Partial<UserInput>) =>
    request<User>(`/users/${encodeURIComponent(id)}`, "PATCH", input),
  recover: (email: string) =>
    request<string>("/users/recovery-password/", "POST", { email }, false),
};
export const AddressesService = {
  list: () => request<Address[]>("/addresses"),
  create: (input: AddressInput) =>
    request<Address>("/addresses", "POST", input),
  update: (id: string, input: AddressInput) =>
    request<Address>(`/addresses/${encodeURIComponent(id)}`, "PATCH", input),
  setDefault: (id: string) =>
    request<Address>(`/addresses/${encodeURIComponent(id)}/default`, "PATCH"),
  clearDefault: () => request<Address[]>("/addresses/default/clear", "PATCH"),
  delete: (id: string) =>
    request<{ message: string }>(
      `/addresses/${encodeURIComponent(id)}`,
      "DELETE",
    ),
};
export const OrderService = {
  list: () => request<Order[]>("/orders"),
  find: (id: string) => request<Order>(`/orders/${encodeURIComponent(id)}`),
  create: (input: OrderInput) => request<Order>("/orders", "POST", input),
  status: (id: string, status: OrderStatus) =>
    request<Order>(`/orders/${encodeURIComponent(id)}/status`, "PATCH", {
      status,
    }),
  cancel: (id: string) =>
    request<Order>(`/orders/${encodeURIComponent(id)}/cancel`, "PATCH"),
};
