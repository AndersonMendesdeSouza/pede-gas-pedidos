import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AppContext } from "./AppContext";
import type { Address, Order, OrderNotice, User } from "../types";
import {
  AddressesService,
  AuthService,
  OrderService,
  UserService,
} from "../services/api";
import {
  getToken,
  readCart,
  readStorage,
  removeToken,
  saveToken,
  writeStorage,
} from "../services/storage";
import { products, statusLabels } from "../data/catalog";
import { errorMessage } from "../utils/order";
import alertSound from "../assets/app/audio/audio1.mp3";

export default function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(getToken()));
  const [cart, setCart] = useState(() =>
    readCart().filter((item) =>
      products.some((product) => product.id === item.productId),
    ),
  );
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [notices, setNotices] = useState<OrderNotice[]>([]);
  const [toast, setToast] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const seenNotices = useRef<OrderNotice[]>([]);
  const firstOrdersLoaded = useRef(false);
  const ordersInFlight = useRef<string | null>(null);
  const notify = useCallback((message: string) => setToast(message), []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setAddresses([]);
    setOrders([]);
    setNotices([]);
    setAddressesError("");
    setOrdersError("");
    setAddressesLoading(true);
    setOrdersLoading(true);
    seenNotices.current = [];
    firstOrdersLoaded.current = false;
  }, []);

  useEffect(() => {
    let active = true;
    if (getToken()) {
      UserService.me()
        .then((profile) => {
          if (active) setUser(profile);
        })
        .catch((error) => {
          if (active) {
            logout();
            notify(errorMessage(error));
          }
        })
        .finally(() => {
          if (active) setAuthLoading(false);
        });
    }
    function onUnauthorized() {
      logout();
      notify("Sua sessão expirou. Entre novamente.");
    }
    window.addEventListener("pedegas:unauthorized", onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("pedegas:unauthorized", onUnauthorized);
    };
  }, [logout, notify]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function login(email: string, password: string) {
    const result = await AuthService.login(email, password);
    try {
      saveToken(result.token);
      const profile = await UserService.me();
      firstOrdersLoaded.current = false;
      setUser(profile);
    } catch (error) {
      logout();
      throw error;
    }
  }

  async function reloadUser() {
    const profile = await UserService.me();
    setUser(profile);
  }

  function setQuantity(productId: string, quantity: number) {
    if (
      !products.some((product) => product.id === productId) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0
    )
      return false;
    const next = cart.filter((item) => item.productId !== productId);
    if (quantity > 0) next.push({ productId, quantity });
    try {
      writeStorage("pedegas:cart", next);
      setCart(next);
      return true;
    } catch (error) {
      notify(errorMessage(error));
      return false;
    }
  }
  function clearCart() {
    // Um pedido já confirmado não deve parecer ter falhado por erro de armazenamento.
    setCart([]);
    try {
      writeStorage("pedegas:cart", []);
    } catch (error) {
      notify(errorMessage(error));
    }
  }

  const reloadAddresses = useCallback(() => {
    if (!user) return Promise.resolve();
    const token = getToken();
    return AddressesService.list()
      .then((result) => {
        if (getToken() === token) {
          setAddresses(result);
          setAddressesError("");
        }
      })
      .catch((error: unknown) => {
        if (getToken() === token) setAddressesError(errorMessage(error));
      })
      .finally(() => {
        if (getToken() === token) setAddressesLoading(false);
      });
  }, [user]);

  const reloadOrders = useCallback(() => {
    if (!user) return Promise.resolve();
    const token = getToken();
    if (!token || ordersInFlight.current === token) return Promise.resolve();
    ordersInFlight.current = token;
    return OrderService.list()
      .then((result) => {
        if (getToken() !== token) return;
        setOrders(result);
        setOrdersError("");
        if (!firstOrdersLoaded.current) {
          const saved = readStorage<unknown>(`pedegas:notices:${user.id}`, []);
          seenNotices.current = Array.isArray(saved)
            ? saved.filter(
                (notice): notice is OrderNotice =>
                  notice &&
                  typeof notice.id === "string" &&
                  typeof notice.orderId === "string" &&
                  typeof notice.title === "string" &&
                  typeof notice.description === "string" &&
                  typeof notice.date === "string" &&
                  typeof notice.read === "boolean",
              )
            : [];
        }
        const fresh: OrderNotice[] = [...result]
          .sort(
            (left, right) =>
              Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
          )
          .slice(0, 50)
          .map((order) => ({
            id: `${order.id}:${order.status}:${order.updatedAt}`,
            orderId: order.id,
            title: `Pedido ${statusLabels[order.status].toLowerCase()}`,
            description: order.items
              .map((item) => `${item.productQuantity}× ${item.productName}`)
              .join(", "),
            date: order.updatedAt,
            read: false,
          }))
          .filter(
            (notice) =>
              !seenNotices.current.some(
                (previous) => previous.id === notice.id,
              ),
          );
        if (firstOrdersLoaded.current && fresh.length) {
          notify(fresh[0].title);
          if (soundEnabled && audio.current)
            void audio.current
              .play()
              .catch(() =>
                notify("Clique em ativar som para permitir os avisos sonoros."),
              );
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            try {
              new Notification(fresh[0].title, { body: fresh[0].description });
            } catch {
              /* Alguns navegadores móveis exigem service worker. */
            }
          }
        }
        const combined = [...fresh, ...seenNotices.current]
          .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
          .slice(0, 50);
        seenNotices.current = combined;
        setNotices(combined);
        try {
          writeStorage(`pedegas:notices:${user.id}`, combined);
        } catch {
          /* Os avisos continuam disponíveis nesta sessão. */
        }
        firstOrdersLoaded.current = true;
      })
      .catch((error: unknown) => {
        if (getToken() === token) setOrdersError(errorMessage(error));
      })
      .finally(() => {
        if (ordersInFlight.current === token) ordersInFlight.current = null;
        if (getToken() === token) setOrdersLoading(false);
      });
  }, [user, notify, soundEnabled]);

  useEffect(() => {
    if (!user) return;
    void reloadAddresses();
    void reloadOrders();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void reloadOrders();
    }, 15000);
    const onFocus = () => {
      void reloadOrders();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, reloadAddresses, reloadOrders]);

  function markNoticesRead(id?: string) {
    if (!user) return;
    const updated = notices.map((notice) => ({
      ...notice,
      read: notice.read || !id || notice.id === id,
    }));
    seenNotices.current = updated;
    setNotices(updated);
    try {
      writeStorage(`pedegas:notices:${user.id}`, updated);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  function toggleSound() {
    if (soundEnabled) {
      setSoundEnabled(false);
      return;
    }
    audio.current ??= new Audio(alertSound);
    void audio.current
      .play()
      .then(() => setSoundEnabled(true))
      .catch(() =>
        notify("Não foi possível reproduzir o som neste navegador."),
      );
  }

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        login,
        logout,
        reloadUser,
        cart,
        setQuantity,
        clearCart,
        addresses,
        addressesLoading,
        addressesError,
        reloadAddresses,
        orders,
        ordersLoading,
        ordersError,
        reloadOrders,
        notices,
        markNoticesRead,
        notify,
        soundEnabled,
        toggleSound,
      }}
    >
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            {toast}
            <button aria-label="Fechar aviso" onClick={() => setToast("")}>
              ×
            </button>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
