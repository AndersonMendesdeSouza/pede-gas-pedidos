import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { coupons, paymentLabels, products } from "../data/catalog";
import {
  addressLabel,
  buildOrder,
  cartTotals,
  currency,
  errorMessage,
} from "../utils/order";
import { OrderService } from "../services/api";
import { navigate } from "../services/navigation";
import type { PaymentMethod } from "../types";
import Icon from "../components/Icon";
import { Empty, ErrorBox, Loading, PageHeading } from "../components/ui";

export default function Cart() {
  const {
    cart,
    setQuantity,
    user,
    clearCart,
    addresses,
    addressesLoading,
    addressesError,
    reloadAddresses,
    reloadOrders,
    notify,
  } = useApp();
  const [step, setStep] = useState<"products" | "checkout">("products");
  const [couponCode, setCouponCode] = useState("");
  const [couponId, setCouponId] = useState("");
  const [couponError, setCouponError] = useState("");
  const [addressId, setAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [observation, setObservation] = useState("");
  const [busy, setBusy] = useState(false);
  const creatingOrder = useRef(false);
  const [error, setError] = useState("");
  const coupon = coupons.find(
    (coupon) => coupon.id === couponId && coupon.status === "available",
  );
  const totals = cartTotals(cart, products, coupon);
  const address =
    addresses.find((address) => address.id === addressId) ??
    addresses.find((address) => address.default);

  function applyCoupon(event: FormEvent) {
    event.preventDefault();
    const found = coupons.find(
      (coupon) =>
        coupon.code === couponCode.trim().toUpperCase() &&
        coupon.status === "available",
    );
    if (!found) {
      setCouponError("Cupom inválido ou indisponível.");
      return;
    }
    setCouponId(found.id);
    setCouponError("");
    notify("Cupom aplicado.");
  }
  async function placeOrder(event: FormEvent) {
    event.preventDefault();
    if (creatingOrder.current) return;
    if (!user) {
      navigate("entrar?voltar=carrinho");
      return;
    }
    if (!address) {
      setError("Selecione ou cadastre um endereço de entrega.");
      return;
    }
    creatingOrder.current = true;
    setBusy(true);
    setError("");
    try {
      const order = await OrderService.create(
        buildOrder(cart, products, address, paymentMethod, coupon, observation),
      );
      clearCart();
      notify("Pedido enviado! Acompanhe a confirmação da revenda.");
      void reloadOrders();
      navigate(`pedido/${encodeURIComponent(order.id)}`);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      creatingOrder.current = false;
      setBusy(false);
    }
  }
  if (!cart.length)
    return (
      <>
        <PageHeading title="Meu carrinho" />
        <Empty icon="cart" title="Seu carrinho está esperando por você">
          <p className="muted">Escolha seu gás ou água mineral para começar.</p>
          <a className="button" href="#/inicio">
            Ver produtos
            <Icon name="arrow" />
          </a>
        </Empty>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="Quase na sua porta"
        title={step === "products" ? "Meu carrinho" : "Finalizar pedido"}
        description={
          step === "products"
            ? "Confira os produtos que você escolheu."
            : "Confirme o endereço e a forma de pagamento."
        }
        action={
          step === "checkout" && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => setStep("products")}
            >
              <Icon name="back" size={17} />
              Editar produtos
            </button>
          )
        }
      />
      <div className="checkout-layout">
        <section className="checkout-main">
          {step === "products" ? (
            <div className="panel cart-items">
              {cart.map((item) => {
                const product = products.find(
                  (product) => product.id === item.productId,
                );
                if (!product) return null;
                return (
                  <article className="cart-item" key={item.productId}>
                    <img src={product.image} alt={product.title} />
                    <div className="cart-item-copy">
                      <h2>{product.title}</h2>
                      <p className="muted">
                        {currency(product.price)} / unidade
                      </p>
                      <button
                        className="text-button danger"
                        onClick={() => setQuantity(product.id, 0)}
                      >
                        Remover
                      </button>
                    </div>
                    <div className="cart-item-controls">
                      <strong>{currency(product.price * item.quantity)}</strong>
                      <div className="quantity-control">
                        <button
                          aria-label={`Diminuir ${product.title}`}
                          onClick={() =>
                            setQuantity(product.id, item.quantity - 1)
                          }
                        >
                          <Icon name="minus" size={16} />
                        </button>
                        <span aria-label="Quantidade">{item.quantity}</span>
                        <button
                          aria-label={`Aumentar ${product.title}`}
                          onClick={() =>
                            setQuantity(product.id, item.quantity + 1)
                          }
                        >
                          <Icon name="plus" size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <>
              {!user ? (
                <div className="panel">
                  <h2>Entre para finalizar</h2>
                  <p className="muted">
                    Seu carrinho continuará aqui enquanto você entra na sua
                    conta.
                  </p>
                  <a className="button" href="#/entrar?voltar=carrinho">
                    Entrar na minha conta
                  </a>
                </div>
              ) : (
                <form
                  id="checkout-form"
                  className="form-stack"
                  onSubmit={placeOrder}
                >
                  <section className="panel">
                    <h2 className="icon-title">
                      <Icon name="pin" />
                      Endereço de entrega
                    </h2>
                    {addressesLoading && <Loading />}
                    {addressesError && (
                      <ErrorBox
                        message={addressesError}
                        retry={() => void reloadAddresses()}
                      />
                    )}
                    <label className="field">
                      <span>Entregar em</span>
                      <select
                        value={address?.id || ""}
                        onChange={(event) => setAddressId(event.target.value)}
                        required
                        disabled={busy}
                      >
                        <option value="" disabled>
                          Selecione o endereço
                        </option>
                        {addresses.map((address) => (
                          <option key={address.id} value={address.id}>
                            {address.name || "Endereço"} ·{" "}
                            {addressLabel(address)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {address && (
                      <p className="address-preview">
                        {[
                          address.neighborhood,
                          address.block && `Quadra ${address.block}`,
                          address.lot && `Lote ${address.lot}`,
                          address.complement,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                    <a className="text-button" href="#/enderecos">
                      Cadastrar ou editar endereço
                      <Icon name="arrow" size={16} />
                    </a>
                  </section>
                  <section className="panel">
                    <h2 className="icon-title">
                      <Icon name="shield" />
                      Pagamento na entrega
                    </h2>
                    <p className="muted">
                      Escolha como pretende pagar ao receber seu pedido.
                    </p>
                    <fieldset className="payment-options" disabled={busy}>
                      <legend className="sr-only">Forma de pagamento</legend>
                      {(Object.keys(paymentLabels) as PaymentMethod[]).map(
                        (method) => (
                          <label
                            key={method}
                            className={
                              paymentMethod === method ? "selected" : ""
                            }
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method}
                              checked={paymentMethod === method}
                              onChange={() => setPaymentMethod(method)}
                            />
                            {paymentLabels[method]}
                          </label>
                        ),
                      )}
                    </fieldset>
                    <label className="field">
                      <span>Observações para a entrega (opcional)</span>
                      <textarea
                        value={observation}
                        onChange={(event) => setObservation(event.target.value)}
                        maxLength={500}
                        disabled={busy}
                        placeholder="Alguma referência ou orientação para a entrega?"
                      />
                    </label>
                  </section>
                  {error && <ErrorBox message={error} />}
                </form>
              )}
            </>
          )}
          <a className="text-button" href="#/inicio">
            <Icon name="back" size={17} />
            Continuar comprando
          </a>
        </section>
        <aside className="panel order-summary">
          <h2>Resumo do pedido</h2>
          <div className="summary-lines">
            <p>
              <span>Produtos</span>
              <strong>{currency(totals.subtotal)}</strong>
            </p>
            <p>
              <span>Entrega</span>
              <strong className="success">Grátis</strong>
            </p>
            {coupon && (
              <p>
                <span>Desconto ({coupon.code})</span>
                <strong className="success">
                  − {currency(totals.discount)}
                </strong>
              </p>
            )}
          </div>
          <form onSubmit={applyCoupon} className="coupon-form">
            <label className="field">
              <span>Tem um cupom?</span>
              <div className="row">
                <input
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Digite o código"
                  aria-label="Código do cupom"
                  disabled={busy}
                />
                <button className="button secondary" disabled={busy}>
                  Aplicar
                </button>
              </div>
            </label>
            {couponError && (
              <p className="field-error" role="alert">
                {couponError}
              </p>
            )}
          </form>
          {coupon && (
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setCouponId("");
                setCouponCode("");
              }}
            >
              Remover cupom
            </button>
          )}
          <a href="#/cupons" className="text-button small">
            Ver cupons disponíveis
          </a>
          <p className="summary-total">
            <span>Total</span>
            <strong>{currency(totals.total)}</strong>
          </p>
          {step === "products" ? (
            <button className="button full" onClick={() => setStep("checkout")}>
              Continuar
              <Icon name="arrow" size={18} />
            </button>
          ) : user ? (
            <button
              className="button full"
              form="checkout-form"
              disabled={busy || addressesLoading || !address}
            >
              {busy ? "Enviando pedido…" : "Confirmar pedido"}
              <Icon name="check" size={18} />
            </button>
          ) : (
            <a className="button full" href="#/entrar?voltar=carrinho">
              Entrar para finalizar
            </a>
          )}
          <p className="form-hint">
            <Icon name="shield" size={15} />
            Você paga ao receber seu pedido.
          </p>
        </aside>
      </div>
    </>
  );
}
