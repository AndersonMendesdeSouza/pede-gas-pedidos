import { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { paymentLabels, statusLabels } from "../data/catalog";
import { OrderService } from "../services/api";
import type { Order, OrderStatus } from "../types";
import { currency, errorMessage, formatDate } from "../utils/order";
import {
  Empty,
  ErrorBox,
  Loading,
  LoginRequired,
  Modal,
  PageHeading,
} from "../components/ui";
import Icon from "../components/Icon";
import motorcycle from "../assets/app/order/moto.png";

export function OrderActions({
  order,
  onChange,
}: {
  order: Order;
  onChange?: (order: Order) => void;
}) {
  const { user, reloadOrders, notify } = useApp();
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next: Partial<
    Record<OrderStatus, { status: OrderStatus; label: string }>
  > = {
    pending: { status: "confirmed", label: "Aceitar pedido" },
    confirmed: { status: "out_for_delivery", label: "Sair para entrega" },
    out_for_delivery: { status: "delivered", label: "Finalizar entrega" },
  };
  const action = next[order.status];
  async function update(cancel: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const updated = cancel
        ? await OrderService.cancel(order.id)
        : await OrderService.status(order.id, action!.status);
      onChange?.(updated);
      setConfirmCancel(false);
      notify(cancel ? "Pedido cancelado." : "Status atualizado.");
      await reloadOrders();
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="row wrap order-actions">
        {user?.role === "admin" && action && (
          <button
            className="button compact"
            disabled={busy}
            onClick={() => void update(false)}
          >
            {busy ? "Atualizando…" : action.label}
          </button>
        )}
        {(order.status === "pending" || order.status === "confirmed") && (
          <button
            className="text-button danger"
            disabled={busy}
            onClick={() => setConfirmCancel(true)}
          >
            Cancelar pedido
          </button>
        )}
      </div>
      {confirmCancel && (
        <Modal
          title="Cancelar este pedido?"
          onClose={() => {
            if (!busy) setConfirmCancel(false);
          }}
        >
          <p>
            Pedido #{order.id.slice(0, 8).toUpperCase()} ·{" "}
            {currency(order.total)}
          </p>
          <p className="muted">O cancelamento será enviado à revenda.</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setConfirmCancel(false)}
            >
              Manter pedido
            </button>
            <button
              className="button destructive"
              disabled={busy}
              onClick={() => void update(true)}
            >
              {busy ? "Cancelando…" : "Confirmar cancelamento"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function OrderCard({ order }: { order: Order }) {
  const { user } = useApp();
  return (
    <article className="panel order-card">
      <div className="row spread wrap">
        <div className="row">
          <span className="tile-icon">
            <Icon name="orders" />
          </span>
          <div>
            <strong>Pedido #{order.id.slice(0, 8).toUpperCase()}</strong>
            <small className="block muted">{formatDate(order.createdAt)}</small>
          </div>
        </div>
        <span className={`status ${order.status}`}>
          {statusLabels[order.status]}
        </span>
      </div>
      {user?.role === "admin" && (
        <p className="customer-name">
          {order.user?.name || "Cliente"}
          {order.user?.phone && (
            <>
              {" "}
              ·{" "}
              <a href={`tel:${order.user.phone.replace(/\D/g, "")}`}>
                {order.user.phone}
              </a>
            </>
          )}
        </p>
      )}
      <div className="order-products">
        {order.items.map((item, index) => (
          <p key={index}>
            <span>
              {item.productQuantity}× {item.productName}
            </span>
            <strong>{currency(item.total)}</strong>
          </p>
        ))}
      </div>
      <div className="row spread wrap">
        <span className="muted">
          {paymentLabels[order.paymentMethod]} · {order.deliveryStreet},{" "}
          {order.deliveryNumber}
        </span>
        <strong>{currency(order.total)}</strong>
      </div>
      <div className="order-card-footer">
        <a
          className="text-button"
          href={`#/pedido/${encodeURIComponent(order.id)}`}
        >
          Ver detalhes e acompanhar
          <Icon name="arrow" size={17} />
        </a>
        <OrderActions order={order} />
      </div>
    </article>
  );
}

export default function Orders() {
  const { user, orders, ordersError, ordersLoading, reloadOrders } = useApp();
  const [filter, setFilter] = useState("all");
  if (!user) return <LoginRequired />;
  const filtered = orders.filter(
    (order) =>
      filter === "all" ||
      (filter === "active"
        ? !["delivered", "canceled"].includes(order.status)
        : order.status === filter),
  );
  const filters =
    user.role === "admin"
      ? [
          { id: "all", label: "Todos" },
          { id: "pending", label: "Pendentes" },
          { id: "confirmed", label: "Aceitos" },
          { id: "out_for_delivery", label: "Em entrega" },
          { id: "delivered", label: "Entregues" },
          { id: "canceled", label: "Cancelados" },
        ]
      : [
          { id: "all", label: "Todos" },
          { id: "active", label: "Em andamento" },
          { id: "delivered", label: "Entregues" },
          { id: "canceled", label: "Cancelados" },
        ];
  return (
    <>
      <PageHeading
        eyebrow={user.role === "admin" ? "Gestão da revenda" : "Suas compras"}
        title={user.role === "admin" ? "Gerenciar pedidos" : "Meus pedidos"}
        description="Acompanhe o status e os detalhes de cada pedido."
        action={
          <button
            className="button secondary"
            onClick={() => void reloadOrders()}
            disabled={ordersLoading}
          >
            <Icon name="refresh" size={17} />
            Atualizar
          </button>
        }
      />
      <div className="tabs">
        {filters.map((item) => (
          <button
            key={item.id}
            className={filter === item.id ? "active" : ""}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {ordersError && (
        <ErrorBox message={ordersError} retry={() => void reloadOrders()} />
      )}
      {ordersLoading && <Loading />}
      {!ordersLoading && !ordersError && !filtered.length && (
        <Empty title="Nenhum pedido por aqui">
          <p className="muted">
            {filter === "all"
              ? "Seus pedidos aparecerão aqui assim que forem realizados."
              : "Não há pedidos com esse status."}
          </p>
          {user.role !== "admin" && (
            <a className="button" href="#/inicio">
              Fazer um pedido
            </a>
          )}
        </Empty>
      )}
      <div className="order-list">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
      <p className="form-hint">
        Atualização automática a cada 15 segundos enquanto o site está aberto.
      </p>
    </>
  );
}

export function OrderTrack({ id }: { id: string }) {
  const { user } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!user) return;
    let active = true;
    let inFlight = false;
    async function load() {
      if (inFlight) return;
      inFlight = true;
      try {
        const result = await OrderService.find(id);
        if (active) {
          setOrder(result);
          setError("");
        }
      } catch (error) {
        if (active) setError(errorMessage(error));
      } finally {
        inFlight = false;
        if (active) setLoading(false);
      }
    }
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [id, user, retry]);
  if (!user) return <LoginRequired />;
  const timeline: OrderStatus[] = [
    "pending",
    "confirmed",
    "out_for_delivery",
    "delivered",
  ];
  const current = order ? timeline.indexOf(order.status) : -1;
  return (
    <>
      <a className="back-link" href="#/pedidos">
        <Icon name="back" size={18} />
        Meus pedidos
      </a>
      <PageHeading
        title="Acompanhar pedido"
        description={
          (order &&
            `Pedido #${order.id.slice(0, 8).toUpperCase()} · ${formatDate(order.createdAt)}`) ||
          undefined
        }
      />
      {loading && <Loading />}
      {error && (
        <ErrorBox
          message={error}
          retry={() => setRetry((value) => value + 1)}
        />
      )}
      {order && (
        <div className="tracking-layout">
          <section className="panel">
            <div className="tracking-hero">
              <img src={motorcycle} alt="Entrega Pede Gás" />
              <div>
                <span className={`status ${order.status}`}>
                  {statusLabels[order.status]}
                </span>
                <h2>
                  {order.status === "delivered"
                    ? "Seu pedido foi entregue!"
                    : order.status === "canceled"
                      ? "Pedido cancelado"
                      : order.status === "out_for_delivery"
                        ? "Seu pedido está a caminho"
                        : "Estamos cuidando do seu pedido"}
                </h2>
                <p className="muted">
                  {order.status === "canceled"
                    ? "Este pedido foi cancelado."
                    : "Acompanhe aqui as atualizações da revenda."}
                </p>
              </div>
            </div>
            {order.status !== "canceled" && (
              <ol className="timeline">
                {timeline.map((status, index) => (
                  <li key={status} className={index <= current ? "done" : ""}>
                    <span>
                      {index < current ? (
                        <Icon name="check" size={16} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <div>
                      <strong>{statusLabels[status]}</strong>
                      <p className="muted">
                        {index < current
                          ? "Concluído"
                          : index === current
                            ? "Status atual"
                            : "Aguardando"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <p className="form-hint">
              Última atualização do pedido: {formatDate(order.updatedAt)}. O
              acompanhamento mostra o status informado pela revenda.
            </p>
            <OrderActions order={order} onChange={setOrder} />
          </section>
          <aside className="form-stack">
            <section className="panel">
              <h2 className="icon-title">
                <Icon name="pin" />
                Endereço de entrega
              </h2>
              <p>
                {order.deliveryStreet}, {order.deliveryNumber}
              </p>
              <p className="muted">
                {[
                  order.deliveryNeighborhood,
                  order.deliveryBlock && `Quadra ${order.deliveryBlock}`,
                  order.deliveryLot && `Lote ${order.deliveryLot}`,
                  order.deliveryCity,
                  order.deliveryState,
                  order.deliveryComplement,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </section>
            <section className="panel">
              <h2>Resumo do pedido</h2>
              <div className="summary-lines">
                {order.items.map((item, index) => (
                  <p key={index}>
                    <span>
                      {item.productQuantity}× {item.productName}
                    </span>
                    <strong>{currency(item.total)}</strong>
                  </p>
                ))}
                <p>
                  <span>Pagamento na entrega</span>
                  <strong>{paymentLabels[order.paymentMethod]}</strong>
                </p>
              </div>
              <p className="summary-total">
                <span>Total</span>
                <strong>{currency(order.total)}</strong>
              </p>
              {order.observation && (
                <p className="info-box">Observações: {order.observation}</p>
              )}
            </section>
          </aside>
        </div>
      )}
    </>
  );
}
