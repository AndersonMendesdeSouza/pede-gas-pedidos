import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { currency } from "../utils/order";
import { OrderCard } from "./Orders";
import { Empty, ErrorBox, Field, Loading, PageHeading } from "../components/ui";
import Icon from "../components/Icon";

export default function Admin({ history = false }: { history?: boolean }) {
  const { orders, ordersError, ordersLoading, reloadOrders } = useApp();
  const [period, setPeriod] = useState("today");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const now = new Date();
  const minimum = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "seven") minimum.setDate(minimum.getDate() - 6);
  if (period === "thirty") minimum.setDate(minimum.getDate() - 29);
  const filtered = orders.filter((order) => {
    const date = new Date(order.createdAt);
    if (period === "custom")
      return (
        (!start || date >= new Date(`${start}T00:00:00`)) &&
        (!end || date <= new Date(`${end}T23:59:59.999`))
      );
    return date >= minimum && date <= now;
  });
  const delivered = filtered.filter((order) => order.status === "delivered");
  const revenue = delivered.reduce(
    (sum, order) => sum + Number(order.total),
    0,
  );
  const pending = filtered.filter((order) => order.status === "pending").length;
  const active = filtered.filter((order) =>
    ["confirmed", "out_for_delivery"].includes(order.status),
  ).length;
  const visible = history
    ? filtered.filter((order) =>
        ["delivered", "canceled"].includes(order.status),
      )
    : filtered;
  const stats = history
    ? [
        {
          title: "Total de pedidos",
          value: String(filtered.length),
          icon: "orders" as const,
        },
        {
          title: "Vendas entregues",
          value: currency(revenue),
          icon: "chart" as const,
        },
        {
          title: "Ticket médio entregue",
          value: currency(delivered.length ? revenue / delivered.length : 0),
          icon: "tag" as const,
        },
      ]
    : [
        {
          title: "Pedidos no período",
          value: String(filtered.length),
          icon: "orders" as const,
        },
        {
          title: "Aguardando confirmação",
          value: String(pending),
          icon: "clock" as const,
        },
        {
          title: "Em andamento",
          value: String(active),
          icon: "truck" as const,
        },
        {
          title: "Vendas entregues",
          value: currency(revenue),
          icon: "chart" as const,
        },
      ];
  return (
    <>
      <PageHeading
        eyebrow="Painel da revenda"
        title={history ? "Histórico de vendas" : "Visão geral"}
        description={
          history
            ? "Consulte pedidos entregues e cancelados."
            : "Acompanhe os pedidos e a operação da sua revenda."
        }
        action={
          <button
            className="button secondary"
            disabled={ordersLoading}
            onClick={() => void reloadOrders()}
          >
            <Icon name="refresh" size={17} />
            Atualizar
          </button>
        }
      />
      <div className="tabs">
        {[
          { id: "today", label: "Hoje" },
          { id: "seven", label: "7 dias" },
          { id: "thirty", label: "30 dias" },
          { id: "custom", label: "Personalizado" },
        ].map((item) => (
          <button
            key={item.id}
            className={period === item.id ? "active" : ""}
            aria-pressed={period === item.id}
            onClick={() => setPeriod(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {period === "custom" && (
        <div className="date-filters">
          <Field
            label="De"
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            max={end || undefined}
          />
          <Field
            label="Até"
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            min={start || undefined}
          />
        </div>
      )}
      {ordersError && (
        <ErrorBox message={ordersError} retry={() => void reloadOrders()} />
      )}
      {ordersLoading ? (
        <Loading />
      ) : (
        <>
          <div className="stats-grid">
            {stats.map((stat) => (
              <article className="panel stat" key={stat.title}>
                <span className="tile-icon">
                  <Icon name={stat.icon} />
                </span>
                <p className="muted">{stat.title}</p>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
          <div className="section-heading">
            <h2>{history ? "Pedidos finalizados" : "Pedidos recentes"}</h2>
            {!history && (
              <a className="text-button" href="#/pedidos">
                Ver todos
                <Icon name="arrow" size={16} />
              </a>
            )}
          </div>
          {!visible.length && !ordersError && (
            <Empty title="Nenhum pedido neste período">
              <p className="muted">
                Os dados aparecerão aqui quando houver pedidos.
              </p>
            </Empty>
          )}
          <div className="order-list">
            {(history ? visible : visible.slice(0, 6)).map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
