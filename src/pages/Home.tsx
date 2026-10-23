import { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { products } from "../data/catalog";
import { currency } from "../utils/order";
import Icon from "../components/Icon";
import banner from "../assets/app/carousel/img3.png";
import { Empty } from "../components/ui";

export default function Home() {
  const { user, cart, setQuantity, notify } = useApp();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const visible = products.filter(
    (product) =>
      (category === "all" || category === product.type) &&
      product.title
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <section className="home-welcome">
        <div>
          <p className="eyebrow">Seu dia mais prático</p>
          <h1>
            Olá{user ? `, ${user.name.split(" ")[0]}` : ""}! O que você precisa
            hoje?
          </h1>
          <p className="muted">Seu gás e água mineral, sem sair de casa.</p>
        </div>
        <span className="delivery-pill">
          <Icon name="truck" />
          Entrega na sua região
        </span>
      </section>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker">
            <Icon name="shield" size={16} />
            Pede Gás · Buriti Alegre
          </span>
          <h2>
            O essencial para sua casa.
            <br />
            <span>A um pedido de distância.</span>
          </h2>
          <p>
            Gás e água mineral com entrega até a sua porta. Escolha seus
            produtos e pague na entrega.
          </p>
          <button
            className="button"
            onClick={() =>
              document
                .getElementById("produtos")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Fazer meu pedido
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <img
          src={banner}
          alt="Gás e água mineral Pede Gás"
          className="hero-image"
        />
      </section>
      <div className="benefits">
        <span>
          <Icon name="truck" />
          Entrega na sua porta
        </span>
        <span>
          <Icon name="shield" />
          Praticidade e segurança
        </span>
        <span>
          <Icon name="check" />
          Pagamento na entrega
        </span>
      </div>
      <section id="produtos" className="catalog-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Peça o seu</p>
            <h2>Nossos produtos</h2>
          </div>
          <label className="search-field">
            <Icon name="search" />
            <input
              type="search"
              aria-label="Buscar produtos"
              placeholder="Buscar produto…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <div className="tabs" aria-label="Categorias">
          {[
            { id: "all", label: "Todos", icon: "home" },
            { id: "gas", label: "Gás", icon: "gas" },
            { id: "water", label: "Água", icon: "water" },
          ].map((item) => (
            <button
              key={item.id}
              aria-pressed={category === item.id}
              className={category === item.id ? "active" : ""}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="product-grid">
          {visible.map((product) => {
            const quantity =
              cart.find((item) => item.productId === product.id)?.quantity ?? 0;
            return (
              <article key={product.id} className="product-card">
                <div className={`product-image ${product.type}`}>
                  <span className="product-badge">{product.badge}</span>
                  <img src={product.image} alt={product.title} loading="lazy" />
                </div>
                <div className="product-info">
                  <p className="product-category">
                    {product.type === "gas" ? "Gás de cozinha" : "Água mineral"}
                  </p>
                  <h3>{product.title}</h3>
                  <p className="muted">{product.description}</p>
                  <div className="product-bottom">
                    <div>
                      <small>A partir de</small>
                      <strong>{currency(product.price)}</strong>
                    </div>
                    <button
                      className="add-button"
                      aria-label={`Adicionar ${product.title} ao carrinho`}
                      onClick={() => {
                        setQuantity(product.id, quantity + 1);
                        notify(`${product.title} adicionado ao carrinho.`);
                      }}
                    >
                      <Icon name="plus" />
                      Adicionar{quantity > 0 && <span>({quantity})</span>}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!visible.length && (
          <Empty icon="search" title="Nenhum produto encontrado">
            <button
              className="text-button"
              onClick={() => {
                setSearch("");
                setCategory("all");
              }}
            >
              Limpar busca
            </button>
          </Empty>
        )}
      </section>
      <a className="coupon-banner" href="#/cupons">
        <span className="tile-icon">
          <Icon name="tag" size={26} />
        </span>
        <div>
          <h3>Seu pedido pode ter desconto</h3>
          <p>Confira os cupons disponíveis antes de finalizar.</p>
        </div>
        <Icon name="arrow" />
      </a>
    </>
  );
}
