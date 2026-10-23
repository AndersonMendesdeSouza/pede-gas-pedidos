import { useState } from "react";
import type { FormEvent } from "react";
import { useApp } from "../contexts/AppContext";
import { UserService } from "../services/api";
import { navigate } from "../services/navigation";
import { errorMessage, digits } from "../utils/order";
import {
  getPasswordValidationMessage,
  isValidEmail,
} from "../utils/validation";
import { ErrorBox, Field } from "../components/ui";
import Icon from "../components/Icon";
import mascot from "../assets/app/mascote/img/mascote-transparent.png";

export default function Auth({
  mode,
}: {
  mode: "entrar" | "cadastro" | "recuperar";
}) {
  const { login, user, notify } = useApp();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [created, setCreated] = useState(false);
  const update = (name: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [name]: value }));
  const title =
    mode === "cadastro"
      ? "Crie sua conta"
      : mode === "recuperar"
        ? "Recuperar senha"
        : "Bom ter você por aqui";
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const email = form.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (mode === "cadastro" && !created) {
      if (digits(form.cpf).length !== 11) {
        setError("Informe um CPF com 11 dígitos.");
        return;
      }
      if (digits(form.phone).length !== 11) {
        setError("Informe um celular com DDD e 11 dígitos.");
        return;
      }
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
      if (mode === "recuperar") {
        await UserService.recover(email);
        setRecoveryRequested(true);
        return;
      }
      if (mode === "cadastro" && !created) {
        await UserService.create({
          name: form.name.trim(),
          email,
          cpf: digits(form.cpf),
          phone: digits(form.phone),
          password: form.password,
        });
        setCreated(true);
      }
      await login(email, form.password);
      notify(
        mode === "cadastro"
          ? "Conta criada. Bem-vindo ao Pede Gás!"
          : "Você entrou na sua conta.",
      );
      const redirect = new URLSearchParams(
        window.location.hash.split("?")[1],
      ).get("voltar");
      navigate(redirect === "carrinho" ? "carrinho" : "inicio");
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (user)
    return (
      <div className="panel auth-already">
        <h1>Você já está conectado</h1>
        <a className="button" href="#/inicio">
          Ir para início
        </a>
      </div>
    );
  return (
    <div className="auth-layout">
      <section className="auth-aside">
        <span className="eyebrow">Pede Gás</span>
        <h2>
          Mais praticidade
          <br />
          para o seu dia.
        </h2>
        <p>
          Peça gás e água mineral, acompanhe seu pedido e receba tudo na sua
          porta.
        </p>
        <img src={mascot} alt="Mascote Pede Gás" />
        <span>
          <Icon name="shield" />
          Seus pedidos em um só lugar
        </span>
      </section>
      <section className="panel auth-form">
        <a href="#/inicio" className="back-link">
          <Icon name="back" size={17} />
          Voltar para o início
        </a>
        <h1>{title}</h1>
        <p className="muted">
          {mode === "cadastro"
            ? "Preencha seus dados para começar."
            : mode === "recuperar"
              ? "Informe o e-mail cadastrado na sua conta."
              : "Entre para pedir e acompanhar suas entregas."}
        </p>
        {recoveryRequested ? (
          <div className="info-box">
            <h2>Solicitação recebida</h2>
            <p>
              A recuperação pelo site ainda não está disponível para redefinir
              sua senha. A senha da sua conta não foi alterada. Entre em contato
              com a revenda para recuperar o acesso.
            </p>
            <a className="text-button" href="#/entrar">
              Voltar para entrar
            </a>
          </div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            {created && (
              <p className="info-box">
                Sua conta foi criada. Tente entrar novamente para continuar.
              </p>
            )}
            <fieldset disabled={busy} className="form-stack">
              {mode === "cadastro" && !created && (
                <>
                  <Field
                    label="Nome completo"
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    required
                    autoComplete="name"
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
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    required
                    type="tel"
                    autoComplete="tel"
                    maxLength={16}
                  />
                </>
              )}
              <Field
                label="E-mail"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                required
                autoComplete="email"
              />
              {mode !== "recuperar" && (
                <>
                  <Field
                    label="Senha"
                    type={visible ? "text" : "password"}
                    value={form.password}
                    onChange={(event) => update("password", event.target.value)}
                    required
                    autoComplete={
                      mode === "cadastro" && !created
                        ? "new-password"
                        : "current-password"
                    }
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={visible}
                      onChange={(event) => setVisible(event.target.checked)}
                    />
                    Mostrar senha
                  </label>
                </>
              )}
              {mode === "cadastro" && !created && (
                <>
                  <p className="form-hint">
                    Use 8 caracteres ou mais, com maiúscula, minúscula e número.
                  </p>
                  <Field
                    label="Confirmar senha"
                    type={visible ? "text" : "password"}
                    value={form.confirm}
                    onChange={(event) => update("confirm", event.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </>
              )}
            </fieldset>
            {error && <ErrorBox message={error} />}
            {mode === "entrar" && (
              <a className="text-button align-right" href="#/recuperar">
                Esqueci minha senha
              </a>
            )}
            <button className="button" disabled={busy}>
              {busy
                ? "Aguarde…"
                : mode === "recuperar"
                  ? "Solicitar recuperação"
                  : mode === "cadastro" && !created
                    ? "Criar conta"
                    : "Entrar"}
              <Icon name="arrow" size={18} />
            </button>
          </form>
        )}
        <p className="auth-switch">
          {mode === "entrar" ? (
            <>
              Ainda não tem conta? <a href="#/cadastro">Cadastre-se</a>
            </>
          ) : (
            <a href="#/entrar">Já tenho conta. Entrar</a>
          )}
        </p>
      </section>
    </div>
  );
}
