import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { formatDate } from "../utils/order";
import Icon from "../components/Icon";
import { Empty, LoginRequired, PageHeading } from "../components/ui";

export default function Notifications() {
  const { user, notices, markNoticesRead, soundEnabled, toggleSound, notify } =
    useApp();
  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : null,
  );
  async function enable() {
    if (!("Notification" in window)) {
      notify("Este navegador não oferece notificações.");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      notify(
        result === "granted"
          ? "Avisos ativados enquanto o site estiver aberto."
          : "Permissão não concedida. Os avisos continuam disponíveis aqui.",
      );
    } catch {
      notify("Não foi possível ativar os avisos neste navegador.");
    }
  }
  if (!user) return <LoginRequired />;
  return (
    <>
      <PageHeading
        title="Notificações"
        description="Atualizações dos seus pedidos em um só lugar."
        action={
          <button
            className="text-button"
            disabled={!notices.some((notice) => !notice.read)}
            onClick={() => markNoticesRead()}
          >
            Marcar todas como lidas
          </button>
        }
      />
      <section className="panel notification-settings">
        <div>
          <h2>Avisos de pedidos</h2>
          <p className="muted">
            Você recebe atualizações enquanto mantém o site aberto. Consulte
            esta página para ver os avisos dos seus pedidos.
          </p>
        </div>
        <div className="row wrap">
          {permission !== null && (
            <button
              className="button secondary"
              onClick={() => void enable()}
              disabled={permission === "granted" || permission === "denied"}
            >
              <Icon name="bell" size={17} />
              {permission === "granted"
                ? "Avisos ativados"
                : permission === "denied"
                  ? "Bloqueados no navegador"
                  : "Ativar avisos"}
            </button>
          )}
          <button className="button secondary" onClick={toggleSound}>
            {soundEnabled ? "Desativar som" : "Ativar som"}
          </button>
        </div>
        {permission === "denied" && (
          <p className="form-hint">
            Para permitir avisos, altere a permissão deste site nas
            configurações do navegador.
          </p>
        )}
      </section>
      {!notices.length && (
        <Empty icon="bell" title="Tudo tranquilo por aqui">
          <p className="muted">
            As atualizações dos seus pedidos aparecerão aqui.
          </p>
        </Empty>
      )}
      <div className="notice-list">
        {notices.map((notice) => (
          <a
            className={`panel notice ${notice.read ? "" : "unread"}`}
            key={notice.id}
            href={`#/pedido/${encodeURIComponent(notice.orderId)}`}
            onClick={() => markNoticesRead(notice.id)}
          >
            <span className="tile-icon">
              <Icon name="bell" />
            </span>
            <div>
              <h2>{notice.title}</h2>
              <p className="muted">{notice.description}</p>
              <small>{formatDate(notice.date)}</small>
            </div>
            {!notice.read && (
              <span className="unread-dot" aria-label="Não lida" />
            )}
            <Icon name="arrow" size={17} />
          </a>
        ))}
      </div>
    </>
  );
}
