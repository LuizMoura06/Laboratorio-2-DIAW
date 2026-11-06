import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api, type Role, type Session } from "./api";

type Props = { onAuth: (session: Session) => void };

const initial = {
  username: "",
  password: "",
  fullName: "",
  cpf: "",
  rg: "",
  address: "",
  profession: "",
  agentName: "",
  cnpj: "",
  agentType: "COMPANY",
};

export default function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("CLIENT");
  const [form, setForm] = useState(initial);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof typeof initial, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await api<Session>(
        mode === "login" ? "/auth/login" : "/auth/register",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "login"
              ? { username: form.username, password: form.password }
              : { ...form, role },
          ),
        },
        null,
      );
      onAuth(session);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível acessar sua conta",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-story">
        <div className="auth-brand">
          <span className="brand-mark">
            <CarFront size={25} />
          </span>
          <span>
            Aluga<span className="brand-accent">Mais</span>
          </span>
        </div>
        <div className="auth-story-main">
          <div className="eyebrow-light">
            <Sparkles size={14} /> GESTÃO INTELIGENTE DE VEÍCULOS
          </div>
          <h1>
            O caminho mais simples para o seu <em>próximo destino.</em>
          </h1>
          <p>
            Uma plataforma para organizar aluguéis, acompanhar solicitações e
            conectar clientes a empresas e bancos.
          </p>
          <div className="auth-illustration">
            <div className="illustration-orbit orbit-one" />
            <div className="illustration-orbit orbit-two" />
            <div className="illustration-car">
              <CarFront size={130} strokeWidth={1} />
            </div>
            <div className="illustration-tag tag-left">
              <CheckCircle2 size={17} /> Solicitação recebida
            </div>
            <div className="illustration-tag tag-right">
              <ShieldCheck size={17} /> Análise segura
            </div>
          </div>
        </div>
        <div className="auth-story-footer">
          <BadgeCheck size={16} /> Projeto acadêmico • Engenharia de Software •
          PUC Minas
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <CarFront size={20} />
            </span>{" "}
            AlugaMais
          </div>
          <span className="kicker">BEM-VINDO À ALUGAMAIS</span>
          <h2>{mode === "login" ? "Entre na sua conta" : "Crie sua conta"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Acesse seus pedidos, veículos e contratos em um só lugar."
              : "Escolha seu perfil e comece a utilizar o sistema."}
          </p>
          <div className="auth-tabs" role="tablist" aria-label="Acesso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Cadastrar
            </button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <>
                <div className="field">
                  <label>Tipo de conta</label>
                  <div className="role-choice">
                    <button
                      type="button"
                      className={role === "CLIENT" ? "selected" : ""}
                      onClick={() => setRole("CLIENT")}
                    >
                      Cliente<span>Solicitar aluguéis</span>
                    </button>
                    <button
                      type="button"
                      className={role === "AGENT" ? "selected" : ""}
                      onClick={() => setRole("AGENT")}
                    >
                      Agente<span>Empresa ou banco</span>
                    </button>
                  </div>
                </div>
                {role === "CLIENT" ? (
                  <>
                    <Field
                      label="Nome completo"
                      value={form.fullName}
                      onChange={(v) => update("fullName", v)}
                      placeholder="Seu nome completo"
                      required
                    />
                    <div className="form-two">
                      <Field
                        label="CPF (11 dígitos)"
                        value={form.cpf}
                        onChange={(v) =>
                          update("cpf", v.replace(/\D/g, "").slice(0, 11))
                        }
                        placeholder="Somente números"
                        required
                      />
                      <Field
                        label="RG"
                        value={form.rg}
                        onChange={(v) => update("rg", v)}
                        placeholder="Número do RG"
                        required
                      />
                    </div>
                    <Field
                      label="Endereço"
                      value={form.address}
                      onChange={(v) => update("address", v)}
                      placeholder="Rua, número, cidade"
                      required
                    />
                    <Field
                      label="Profissão"
                      value={form.profession}
                      onChange={(v) => update("profession", v)}
                      placeholder="Sua profissão"
                      required
                    />
                  </>
                ) : (
                  <>
                    <Field
                      label="Nome da empresa ou banco"
                      value={form.agentName}
                      onChange={(v) => update("agentName", v)}
                      placeholder="Razão social"
                      required
                    />
                    <div className="form-two">
                      <Field
                        label="CNPJ (14 dígitos)"
                        value={form.cnpj}
                        onChange={(v) =>
                          update("cnpj", v.replace(/\D/g, "").slice(0, 14))
                        }
                        placeholder="Somente números"
                        required
                      />
                      <div className="field">
                        <label htmlFor="agent-type">Categoria</label>
                        <select
                          id="agent-type"
                          value={form.agentType}
                          onChange={(e) => update("agentType", e.target.value)}
                        >
                          <option value="COMPANY">Empresa</option>
                          <option value="BANK">Banco</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
            <Field
              label="Usuário"
              value={form.username}
              onChange={(v) => update("username", v.toLowerCase())}
              placeholder="seu.usuario"
              required
              minLength={3}
            />
            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="password-field">
                <LockKeyhole size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder={
                    mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"
                  }
                  required
                  minLength={mode === "register" ? 8 : 1}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && (
              <div className="inline-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar na plataforma"
                  : "Criar minha conta"}{" "}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-assurance">
            <ShieldCheck size={15} /> Suas informações são protegidas e o acesso
            exige autenticação.
          </p>
        </div>
      </section>
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  minLength,
  disabled = false,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        required={required}
        minLength={minLength}
        disabled={disabled}
      />
    </div>
  );
}
