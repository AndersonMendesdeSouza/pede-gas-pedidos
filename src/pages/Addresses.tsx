import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { AddressesService } from "../services/api";
import { locate } from "../services/location";
import type { Address, AddressInput } from "../types";
import { addressLabel, digits, errorMessage } from "../utils/order";
import {
  Empty,
  ErrorBox,
  Field,
  Loading,
  LoginRequired,
  Modal,
  PageHeading,
} from "../components/ui";
import Icon from "../components/Icon";

const emptyAddress: AddressInput = {
  name: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  block: "",
  lot: "",
  complement: "",
  country: "Brasil",
  default: false,
};

function AddressForm({
  address,
  onClose,
}: {
  address: Address | null;
  onClose: () => void;
}) {
  const { reloadAddresses, addresses, notify } = useApp();
  const [form, setForm] = useState<AddressInput>(() => {
    const initial = { ...emptyAddress, default: addresses.length === 0 };
    if (address)
      for (const key of Object.keys(initial) as (keyof AddressInput)[])
        Object.assign(initial, { [key]: address[key] ?? initial[key] });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState("");
  const [error, setError] = useState("");
  const change = (key: keyof AddressInput, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function handleLocate() {
    setLocating(true);
    setError("");
    setLocationNote("");
    try {
      const location = await locate();
      const filled = Object.fromEntries(
        Object.entries(location.address).filter(([, value]) => Boolean(value)),
      );
      setForm((current) => ({ ...current, ...filled }));
      setLocationNote(
        location.address.street
          ? "Confira os dados encontrados e complete o número antes de salvar."
          : `Localização encontrada: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}. Preencha seu endereço para uma entrega correta.`,
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLocating(false);
    }
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const payload = {
      ...form,
      state: form.state.trim().toUpperCase(),
      zipCode: digits(form.zipCode),
    };
    if (payload.zipCode.length !== 8) {
      setError("Informe um CEP com 8 dígitos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (address) await AddressesService.update(address.id, payload);
      else await AddressesService.create(payload);
      await reloadAddresses();
      notify("Endereço salvo.");
      onClose();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      title={address ? "Editar endereço" : "Novo endereço"}
      onClose={() => {
        if (!saving && !locating) onClose();
      }}
    >
      <form onSubmit={save} className="form-stack">
        <button
          type="button"
          className="button secondary"
          onClick={() => void handleLocate()}
          disabled={locating || saving}
        >
          <Icon name="pin" />
          {locating ? "Buscando localização…" : "Usar minha localização"}
        </button>
        {locationNote && (
          <p className="info-box" role="status">
            {locationNote}
          </p>
        )}
        <fieldset disabled={saving || locating} className="form-grid">
          <Field
            label="Nome do endereço"
            placeholder="Casa, trabalho…"
            value={form.name}
            onChange={(event) => change("name", event.target.value)}
            maxLength={80}
          />
          <Field
            label="CEP"
            value={form.zipCode}
            onChange={(event) => change("zipCode", event.target.value)}
            autoComplete="postal-code"
            required
            inputMode="numeric"
            maxLength={9}
          />
          <Field
            label="Rua / avenida"
            value={form.street}
            onChange={(event) => change("street", event.target.value)}
            autoComplete="address-line1"
            required
          />
          <Field
            label="Número"
            value={form.number}
            onChange={(event) => change("number", event.target.value)}
            placeholder="123 ou S/N"
            required
          />
          <Field
            label="Bairro"
            value={form.neighborhood}
            onChange={(event) => change("neighborhood", event.target.value)}
            required
          />
          <Field
            label="Cidade"
            value={form.city}
            onChange={(event) => change("city", event.target.value)}
            autoComplete="address-level2"
            required
          />
          <Field
            label="Estado (UF)"
            value={form.state}
            onChange={(event) =>
              change("state", event.target.value.toUpperCase())
            }
            autoComplete="address-level1"
            required
            minLength={2}
            maxLength={2}
            pattern="[A-Za-z]{2}"
          />
          <Field
            label="Quadra"
            value={form.block}
            onChange={(event) => change("block", event.target.value)}
          />
          <Field
            label="Lote"
            value={form.lot}
            onChange={(event) => change("lot", event.target.value)}
          />
          <Field
            label="Complemento / referência"
            value={form.complement}
            onChange={(event) => change("complement", event.target.value)}
            autoComplete="address-line2"
          />
          <label className="checkbox span-full">
            <input
              type="checkbox"
              checked={form.default}
              onChange={(event) => change("default", event.target.checked)}
            />
            Usar como endereço de entrega padrão
          </label>
        </fieldset>
        {error && <ErrorBox message={error} />}
        <button className="button" disabled={saving || locating}>
          {saving ? "Salvando…" : "Salvar endereço"}
        </button>
      </form>
    </Modal>
  );
}

export default function Addresses() {
  const {
    user,
    addresses,
    addressesError,
    addressesLoading,
    reloadAddresses,
    notify,
  } = useApp();
  const [editing, setEditing] = useState<Address | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);
  async function setDefault(address: Address) {
    if (busy) return;
    setBusy(true);
    try {
      await AddressesService.setDefault(address.id);
      await reloadAddresses();
      notify("Endereço de entrega atualizado.");
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function clearDefault() {
    setBusy(true);
    try {
      await AddressesService.clearDefault();
      await reloadAddresses();
      notify("Endereço padrão removido.");
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await AddressesService.delete(deleting.id);
      await reloadAddresses();
      setDeleting(null);
      notify("Endereço excluído.");
    } catch (error) {
      notify(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!user) return <LoginRequired />;
  return (
    <>
      <PageHeading
        eyebrow="Sua conta"
        title="Meus endereços"
        description="Escolha onde você quer receber seus pedidos."
        action={
          <button className="button" onClick={() => setEditing(null)}>
            <Icon name="plus" />
            Novo endereço
          </button>
        }
      />
      {addressesLoading && <Loading />}
      {addressesError && (
        <ErrorBox
          message={addressesError}
          retry={() => void reloadAddresses()}
        />
      )}
      {!addressesLoading && !addressesError && !addresses.length && (
        <Empty icon="pin" title="Onde vamos entregar?">
          <p className="muted">
            Cadastre seu primeiro endereço para finalizar um pedido.
          </p>
          <button className="button" onClick={() => setEditing(null)}>
            Cadastrar endereço
          </button>
        </Empty>
      )}
      <div className="address-grid">
        {addresses.map((address) => (
          <article
            key={address.id}
            className={`panel address-card ${address.default ? "selected" : ""}`}
          >
            <div className="row spread">
              <span className="tile-icon">
                <Icon name="pin" />
              </span>
              {address.default && <span className="badge">Entrega padrão</span>}
            </div>
            <h2>{address.name || "Endereço salvo"}</h2>
            <p>{addressLabel(address)}</p>
            <p className="muted">
              {[
                address.neighborhood,
                address.block && `Quadra ${address.block}`,
                address.lot && `Lote ${address.lot}`,
                address.complement,
                address.zipCode,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="row wrap">
              {!address.default ? (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void setDefault(address)}
                >
                  Entregar aqui
                </button>
              ) : (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void clearDefault()}
                >
                  Desmarcar padrão
                </button>
              )}
              <button
                className="text-button"
                disabled={busy}
                onClick={() => setEditing(address)}
              >
                Editar
              </button>
              <button
                className="text-button danger"
                disabled={busy}
                onClick={() => setDeleting(address)}
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing !== undefined && (
        <AddressForm
          key={editing?.id || "new"}
          address={editing}
          onClose={() => setEditing(undefined)}
        />
      )}
      {deleting && (
        <Modal
          title="Excluir endereço?"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p>{addressLabel(deleting)}</p>
          <p className="muted">Essa ação remove o endereço da sua conta.</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Voltar
            </button>
            <button
              className="button destructive"
              disabled={busy}
              onClick={() => void remove()}
            >
              {busy ? "Excluindo…" : "Excluir endereço"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
