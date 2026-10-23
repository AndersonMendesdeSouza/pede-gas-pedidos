import { useState } from "react";
import { coupons } from "../data/catalog";
import { useApp } from "../contexts/AppContext";
import Icon from "../components/Icon";
import { PageHeading } from "../components/ui";
import { errorMessage } from "../utils/order";

export default function Coupons() {
  const [filter, setFilter] = useState("all");
  const { notify } = useApp();
  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      notify(`Cupom ${code} copiado.`);
    } catch (error) {
      notify(`Selecione o código para copiar: ${code}. ${errorMessage(error)}`);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="Vantagens para você"
        title="Meus cupons"
        description="Uma economia extra para o seu próximo pedido."
      />
      <p className="info-box">
        Ofertas e progresso exibidos conforme o catálogo do Pede Gás. As regras
        de fidelidade ainda não são atualizadas automaticamente.
      </p>
      <div className="tabs">
        {[
          { id: "all", label: "Todos" },
          { id: "available", label: "Disponíveis" },
          { id: "progress", label: "Em progresso" },
          { id: "locked", label: "Bloqueados" },
        ].map((item) => (
          <button
            key={item.id}
            aria-pressed={filter === item.id}
            className={filter === item.id ? "active" : ""}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="coupon-grid">
        {coupons
          .filter((coupon) => filter === "all" || coupon.status === filter)
          .map((coupon) => (
            <article
              key={coupon.id}
              className={`panel coupon-card ${coupon.status !== "available" ? "coupon-locked" : ""}`}
            >
              <div className="row spread">
                <span className="tile-icon">
                  <Icon name="tag" />
                </span>
                <strong className="coupon-discount">
                  {coupon.discountLabel}
                </strong>
              </div>
              <h2>{coupon.title}</h2>
              <p className="muted">{coupon.description}</p>
              <small>{coupon.expiresAt}</small>
              <div className="coupon-rule">
                <span>{coupon.rule}</span>
                {coupon.status !== "available" && (
                  <progress
                    value={coupon.progress}
                    max={1}
                    aria-label={coupon.rule}
                  />
                )}
              </div>
              <div className="coupon-code">
                <code>{coupon.code}</code>
                {coupon.status === "available" ? (
                  <button
                    className="text-button"
                    onClick={() => void copy(coupon.code)}
                  >
                    Copiar código
                  </button>
                ) : (
                  <span className="muted">
                    {coupon.status === "locked" ? "Bloqueado" : "Em progresso"}
                  </span>
                )}
              </div>
              {coupon.status === "available" && (
                <a href="#/carrinho" className="text-button">
                  Usar no carrinho
                  <Icon name="arrow" size={16} />
                </a>
              )}
            </article>
          ))}
      </div>
    </>
  );
}
