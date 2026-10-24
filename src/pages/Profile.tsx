import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { UserService } from "../services/api";
import { navigate } from "../services/navigation";
import { addressLabel, digits, errorMessage } from "../utils/order";
import { getPasswordValidationMessage } from "../utils/validation";
import { ErrorBox, Field, LoginRequired, PageHeading } from "../components/ui";
import Icon from "../components/Icon";
import type { IconName } from "../components/Icon";

export default function Profile() {
  const { user, addresses, logout } = useApp();
  if (!user) return <LoginRequired />;
  const address = addresses.find((address) => address.default);
  const menu: { route: string; title: string; text: string; icon: IconName }[] =
    [
      {
        route: "editar-perfil",
        title: "Editar perfil",
        text: "Nome, telefone, e-mail e dados pessoais",
        icon: "edit",
      },
      {
        route: "enderecos",
        title: "Meus endereços",
        text: "Gerencie seus locais de entrega",
        icon: "pin",
      },
      {
        route: "pedidos",
        title: "Histórico de pedidos",
        text: "Veja entregas, status e compras anteriores",
        icon: "orders",
      },
      {
        route: "notificacoes",
        title: "Notificações",
        text: "Atualizações dos seus pedidos",
        icon: "bell",
      },
    ];
  return (
    <>
      <PageHeading eyebrow="Tudo sobre você" title="Meu perfil" />
      <div className="profile-layout">
        <section className="panel profile-card">
          <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <p className="muted">{user.phone}</p>
          <span className="badge">
            {user.role === "admin" ? "Administrador" : "Cliente Pede Gás"}
          </span>
          <a className="button secondary full" href="#/editar-perfil">
            Editar meu perfil
          </a>
          <div className="profile-address">
            <Icon name="pin" />
            <div>
              <strong>Endereço de entrega</strong>
              <p className="muted">
                {address
                  ? addressLabel(address)
                  : "Nenhum endereço padrão selecionado"}
              </p>
            </div>
          </div>
        </section>
        <section className="form-stack">
          <div className="panel menu-list">
            {menu.map((item) => (
              <a key={item.route} href={`#/${item.route}`}>
                <span className="tile-icon">
                  <Icon name={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.text}</p>
                </div>
                <Icon name="arrow" size={18} />
              </a>
            ))}
          </div>
          <button
            className="logout-button"
            onClick={() => {
              logout();
              navigate("entrar");
            }}
          >
            <Icon name="logout" />
            Sair da conta
          </button>
        </section>
      </div>
    </>
  );
}

export function EditProfile() {
  const { user, reloadUser, notify } = useApp();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    cpf: user?.cpf || "",
    phone: user?.phone || "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    setError("");
    if (digits(form.cpf).length !== 11 || digits(form.phone).length !== 11) {
      setError(
        "Confira o CPF e o celular com DDD. Ambos devem ter 11 dígitos.",
      );
      return;
    }
    if (form.password) {
      const validation = getPasswordValidationMessage(form.password);
      if (validation) {
        setError(validation);
        return;
      }
      if (form.password !== form.confirm) {
        setError("As senhas não coincidem.");
        return;
      }
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        cpf: digits(form.cpf),
        phone: digits(form.phone),
        ...(form.password ? { password: form.password } : {}),
      };
      await UserService.update(user.id, payload);
      await reloadUser();
      notify("Perfil atualizado.");
      navigate("perfil");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!user) return <LoginRequired />;
  return (
    <>
      <a className="back-link" href="#/perfil">
        <Icon name="back" size={17} />
        Meu perfil
      </a>
      <PageHeading
        title="Editar perfil"
        description="Mantenha seus dados de contato atualizados."
      />
      <form className="panel profile-form form-stack" onSubmit={save}>
        <fieldset className="form-grid" disabled={busy}>
          <Field
            label="Nome completo"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            required
            autoComplete="name"
          />
          <Field
            label="E-mail"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            required
            autoComplete="email"
          />
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(event) => update("cpf", event.target.value)}
            required
            inputMode="numeric"
            maxLength={14}
          />
          <Field
            label="Celular com DDD"
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            required
            autoComplete="tel"
            maxLength={16}
          />
          <div className="span-full">
            <h2>Alterar senha</h2>
            <p className="muted">
              Preencha apenas se quiser trocar sua senha. Use ao menos 8
              caracteres, maiúscula, minúscula e número.
            </p>
          </div>
          <Field
            label="Nova senha"
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            autoComplete="new-password"
          />
          <Field
            label="Confirmar nova senha"
            type="password"
            value={form.confirm}
            onChange={(event) => update("confirm", event.target.value)}
            required={Boolean(form.password)}
            autoComplete="new-password"
          />
        </fieldset>
        {error && <ErrorBox message={error} />}
        <div className="row wrap">
          <button className="button" disabled={busy}>
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
          <a className="text-button" href="#/perfil">
            Voltar
          </a>
        </div>
      </form>
    </>
  );
}
