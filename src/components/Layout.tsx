import type { ReactNode } from "react";
import { useApp } from "../contexts/AppContext";
import { useRoute } from "../services/navigation";
import { addressLabel } from "../utils/order";
import Icon from "./Icon";
import type { IconName } from "./Icon";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, cart, addresses, notices } = useApp();
  const route = useRoute().split("/")[0];
  const admin = user?.role === "admin";
  const links: { route: string; label: string; icon: IconName }[] = admin
    ? [
        { route: "inicio", label: "Dashboard", icon: "chart" },
        { route: "pedidos", label: "Pedidos", icon: "orders" },
        { route: "historico", label: "Histórico", icon: "clock" },
        { route: "perfil", label: "Perfil", icon: "user" },
      ]
    : [
        { route: "inicio", label: "Início", icon: "home" },
        { route: "pedidos", label: "Pedidos", icon: "orders" },
        { route: "cupons", label: "Cupons", icon: "tag" },
        { route: "perfil", label: "Perfil", icon: "user" },
      ];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const unread = notices.filter((notice) => !notice.read).length;
  const address = addresses.find((address) => address.default);
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Pular para conteúdo
      </a>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#/inicio" aria-label="Pede Gás início">
            <span className="brand-icon">
              <Icon name="gas" size={29} />
            </span>
            <span>
              Pede<span className="brand-blue">Gás</span>
              <small>
                {admin ? "Painel da revenda" : "Gás e água na sua porta"}
              </small>
            </span>
          </a>
          <a className="delivery-location" href="#/enderecos">
            <Icon name="pin" />
            <span>
              <small>Entregar em</small>
              <strong>
                {address ? addressLabel(address) : "Selecione seu endereço"}
              </strong>
            </span>
            <span>⌄</span>
          </a>
          <nav className="desktop-nav" aria-label="Principal">
            {links.map((link) => (
              <a
                key={link.route}
                href={`#/${link.route}`}
                className={route === link.route ? "active" : ""}
                aria-current={route === link.route ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <a
              className="icon-button notification-button"
              href="#/notificacoes"
              aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}
            >
              <Icon name="bell" />
              {unread > 0 && <span className="notification-dot" />}
            </a>
            {!admin && (
              <a
                className="cart-button"
                href="#/carrinho"
                aria-label={`Carrinho, ${count} itens`}
              >
                <Icon name="cart" />
                <span className="cart-label">Carrinho</span>
                <span className="count">{count}</span>
              </a>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="main-content">
        {children}
      </main>
      <footer className="site-footer">
        <span>Pede Gás · Buriti Alegre, GO</span>
        <span>Gás e água, com a praticidade que você precisa.</span>
      </footer>
      <nav className="mobile-nav" aria-label="Principal no celular">
        {links.map((link) => (
          <a
            key={link.route}
            href={`#/${link.route}`}
            className={route === link.route ? "active" : ""}
            aria-current={route === link.route ? "page" : undefined}
          >
            <Icon name={link.icon} />
            <span>{link.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
