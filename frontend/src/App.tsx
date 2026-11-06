import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  api,
  dateBr,
  loadSession,
  money,
  rentalTotal,
  saveSession,
  statusLabels,
  type Bank,
  type Client,
  type Contract,
  type Rental,
  type RentalStatus,
  type Session,
  type Vehicle,
} from "./api";
import AuthScreen, { Field } from "./AuthScreen";

type Page =
  | "overview"
  | "vehicles"
  | "rentals"
  | "profile"
  | "clients"
  | "contracts";
type RentalDraft = {
  vehicleId: string;
  startDate: string;
  endDate: string;
  notes: string;
};
const blankRental: RentalDraft = {
  vehicleId: "",
  startDate: "",
  endDate: "",
  notes: "",
};
const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

export default function App() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const authorize = (value: Session) => {
    saveSession(value);
    setSession(value);
  };
  const leave = () => {
    saveSession(null);
    setSession(null);
  };
  return session ? (
    <Workspace key={session.username} session={session} onLogout={leave} />
  ) : (
    <AuthScreen onAuth={authorize} />
  );
}

function Workspace({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const agent = session.role === "AGENT";
  const [page, setPage] = useState<Page>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [profile, setProfile] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);
  const [rentalDraft, setRentalDraft] = useState<RentalDraft | null>(null);
  const [editingRental, setEditingRental] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Rental | null>(null);
  const [contracting, setContracting] = useState<Rental | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [employerDialog, setEmployerDialog] = useState<{
    id: string | null;
    employer: string;
    monthlyIncome: string;
  } | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [busy, setBusy] = useState(false);

  const notify = (message: string, error = false) =>
    setNotice({ message, error });
  const refresh = useCallback(async () => {
    try {
      const [v, r, c, b, p] = await Promise.all([
        api<Vehicle[]>("/vehicles"),
        api<Rental[]>("/rentals"),
        api<Contract[]>("/rentals/contracts"),
        api<Bank[]>("/rentals/banks"),
        agent ? api<Client[]>("/clients") : api<Client>("/clients/me"),
      ]);
      setVehicles(v);
      setRentals(r);
      setContracts(c);
      setBanks(b);
      if (agent) setClients(p as Client[]);
      else setProfile(p as Client);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Falha ao buscar dados",
        true,
      );
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function perform(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      await refresh();
      notify(message);
      return true;
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Operação não concluída",
        true,
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  const createRental = (vehicleId = "") => {
    setEditingRental(null);
    setRentalDraft({ ...blankRental, vehicleId });
  };
  const editRental = (rental: Rental) => {
    setEditingRental(rental.id);
    setRentalDraft({
      vehicleId: rental.vehicleId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      notes: rental.notes ?? "",
    });
  };
  const filteredRentals = rentals.filter((r) => {
    const searchMatch = `${r.clientName} ${r.brand} ${r.model} ${r.plate}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return searchMatch && (filter === "all" || r.status === filter);
  });
  const filteredVehicles = vehicles.filter((v) =>
    `${v.brand} ${v.model} ${v.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const pending = rentals.filter((r) =>
    ["PENDING", "UNDER_REVIEW"].includes(r.status),
  ).length;
  const approved = rentals.filter((r) =>
    ["APPROVED", "CONTRACTED"].includes(r.status),
  ).length;

  const links: { page: Page; text: string; icon: ReactNode }[] = [
    {
      page: "overview",
      text: "Visão geral",
      icon: <LayoutDashboard size={19} />,
    },
    { page: "vehicles", text: "Veículos", icon: <CarFront size={19} /> },
    {
      page: "rentals",
      text: agent ? "Análise de pedidos" : "Meus pedidos",
      icon: <ClipboardList size={19} />,
    },
    ...(agent
      ? [
          {
            page: "clients" as const,
            text: "Clientes",
            icon: <Users size={19} />,
          },
        ]
      : [
          {
            page: "profile" as const,
            text: "Meu cadastro",
            icon: <UserRound size={19} />,
          },
        ]),
    { page: "contracts", text: "Contratos", icon: <FileText size={19} /> },
  ];
  const navigate = (value: Page) => {
    setPage(value);
    setMobileNav(false);
    setSearch("");
    setFilter("all");
    setNotice(null);
  };
  const title: Record<Page, string> = {
    overview: "Visão geral",
    vehicles: "Explore os veículos",
    rentals: agent ? "Análise de pedidos" : "Meus pedidos",
    profile: "Meu cadastro",
    clients: "Clientes cadastrados",
    contracts: "Contratos de aluguel",
  };

  return (
    <div className="app-shell">
      <div
        className={`sidebar-overlay ${mobileNav ? "visible" : ""}`}
        onClick={() => setMobileNav(false)}
      />
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <CarFront size={25} />
          </span>
          <div>
            <strong>
              Aluga<span>Mais</span>
            </strong>
            <small>GESTÃO DE ALUGUÉIS</small>
          </div>
        </div>
        <div className="sidebar-section-label">MENU PRINCIPAL</div>
        <nav aria-label="Navegação principal" className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.page}
              type="button"
              className={`nav-item ${page === link.page ? "active" : ""}`}
              onClick={() => navigate(link.page)}
            >
              {link.icon}
              <span>{link.text}</span>
              {link.page === "rentals" && pending > 0 && (
                <small>{pending}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-help">
          <span>
            <ShieldCheck size={18} />
          </span>
          <strong>Acesso protegido</strong>
          <p>Dados organizados com autenticação e perfis de usuário.</p>
        </div>
        <button
          type="button"
          className="sidebar-user"
          onClick={() => {
            void api("/auth/logout", { method: "POST" }).catch(() => {});
            onLogout();
          }}
        >
          <span className="avatar">{session.name.charAt(0).toUpperCase()}</span>
          <span className="user-info">
            <strong>{session.name}</strong>
            <small>{agent ? "Agente" : "Cliente"}</small>
          </span>
          <LogOut size={17} />
        </button>
      </aside>

      <div className="main-region">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            <span>Painel</span>
            <span>/</span>
            <strong>{title[page]}</strong>
          </div>
          <div className="topbar-actions">
            <span className="topbar-date">
              <CalendarDays size={16} />
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="topbar-avatar">
              {session.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="content">
          {notice && (
            <div
              className={`notice ${notice.error ? "error" : "success"}`}
              role="status"
            >
              {notice.error ? (
                <CircleAlert size={19} />
              ) : (
                <CheckCircle2 size={19} />
              )}
              <span>{notice.message}</span>
              <button aria-label="Fechar aviso" onClick={() => setNotice(null)}>
                <X size={17} />
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <span>Carregando informações...</span>
            </div>
          ) : (
            <>
              {page === "overview" && (
                <>
                  <section className="welcome-block">
                    <div>
                      <span className="kicker">
                        PAINEL {agent ? "DO AGENTE" : "DO CLIENTE"}
                      </span>
                      <h1>
                        Olá, {session.name.split(" ")[0]}{" "}
                        <span className="wave">✳</span>
                      </h1>
                      <p>
                        {agent
                          ? "Acompanhe as solicitações e conduza as avaliações financeiras."
                          : "Escolha seu próximo carro e acompanhe tudo em um só lugar."}
                      </p>
                    </div>
                    <span className="welcome-icon">
                      <Gauge size={48} strokeWidth={1.3} />
                    </span>
                  </section>
                  <div className="stats-grid">
                    <Stat
                      label="Veículos disponíveis"
                      number={vehicles.length}
                      icon={<CarFront />}
                      accent="blue"
                      note="Opções cadastradas na frota"
                    />
                    <Stat
                      label={
                        agent ? "Pedidos para análise" : "Pedidos em andamento"
                      }
                      number={pending}
                      icon={<Clock3 />}
                      accent="amber"
                      note="Aguardando decisão"
                    />
                    <Stat
                      label="Pedidos aprovados"
                      number={approved}
                      icon={<CheckCircle2 />}
                      accent="green"
                      note="Inclui contratos firmados"
                    />
                    <Stat
                      label="Contratos"
                      number={contracts.length}
                      icon={<FileCheck2 />}
                      accent="violet"
                      note="Contratos registrados"
                    />
                  </div>
                  <div className="dashboard-columns">
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <span className="kicker">ACOMPANHAMENTO</span>
                          <h2>Pedidos recentes</h2>
                        </div>
                        <button
                          className="text-action"
                          onClick={() => navigate("rentals")}
                        >
                          Ver todos <ArrowRight size={16} />
                        </button>
                      </div>
                      {rentals.length ? (
                        <div className="compact-rentals">
                          {rentals.slice(0, 4).map((r) => (
                            <div className="compact-rental" key={r.id}>
                              <div className="mini-car">
                                <CarFront size={22} />
                              </div>
                              <div>
                                <strong>
                                  {r.brand} {r.model}
                                </strong>
                                <small>
                                  {agent
                                    ? r.clientName
                                    : `${dateBr(r.startDate)} a ${dateBr(r.endDate)}`}
                                </small>
                              </div>
                              <Status value={r.status} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Empty
                          icon={<ClipboardList />}
                          heading="Nenhum pedido por enquanto"
                          description={
                            agent
                              ? "Os pedidos dos clientes aparecerão aqui."
                              : "Comece explorando a frota disponível."
                          }
                        />
                      )}
                    </section>
                    <section className="panel next-step">
                      <span className="kicker">PRÓXIMO PASSO</span>
                      <div className="next-step-icon">
                        <CarFront size={37} />
                      </div>
                      <h2>
                        {agent
                          ? "Organize suas análises"
                          : "Seu próximo carro espera por você"}
                      </h2>
                      <p>
                        {agent
                          ? "Consulte os pedidos, avalie os dados dos clientes e registre o parecer."
                          : "Explore os veículos, escolha as datas e envie sua solicitação em poucos passos."}
                      </p>
                      <button
                        className="primary-button"
                        onClick={() => navigate(agent ? "rentals" : "vehicles")}
                      >
                        {agent ? "Avaliar pedidos" : "Explorar veículos"}{" "}
                        <ArrowRight size={17} />
                      </button>
                    </section>
                  </div>
                </>
              )}

              {page === "vehicles" && (
                <>
                  <PageHeading
                    eyebrow="NOSSA FROTA"
                    title="Encontre o carro ideal"
                    subtitle="Conheça os veículos cadastrados e suas condições de aluguel."
                    action={
                      !agent && (
                        <button
                          className="primary-button"
                          onClick={() => createRental()}
                        >
                          <Plus size={17} /> Novo pedido
                        </button>
                      )
                    }
                  />
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    placeholder="Buscar por marca, modelo ou categoria"
                  />
                  <div className="vehicle-grid">
                    {filteredVehicles.map((vehicle, index) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        index={index}
                        onChoose={
                          !agent ? () => createRental(vehicle.id) : undefined
                        }
                      />
                    ))}
                  </div>
                  {!filteredVehicles.length && (
                    <Empty
                      icon={<Search />}
                      heading="Nenhum veículo encontrado"
                      description="Tente outra marca ou categoria."
                    />
                  )}
                </>
              )}

              {page === "rentals" && (
                <>
                  <PageHeading
                    eyebrow="GESTÃO DE SOLICITAÇÕES"
                    title={
                      agent
                        ? "Analise as solicitações"
                        : "Acompanhe seus pedidos"
                    }
                    subtitle={
                      agent
                        ? "Avalie financeiramente, aprove ou recuse pedidos de aluguel."
                        : "Consulte o andamento, altere ou cancele seus pedidos."
                    }
                    action={
                      !agent && (
                        <button
                          className="primary-button"
                          onClick={() => createRental()}
                        >
                          <Plus size={17} /> Novo pedido
                        </button>
                      )
                    }
                  />
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    placeholder="Buscar por cliente, veículo ou placa"
                    filter={filter}
                    setFilter={setFilter}
                  />
                  {filteredRentals.length ? (
                    <div className="rental-list">
                      {filteredRentals.map((r) => (
                        <article key={r.id} className="rental-card">
                          <div className="rental-main">
                            <span className="car-badge">
                              <CarFront size={29} />
                            </span>
                            <div>
                              <div className="rental-name">
                                {r.brand} {r.model} <Status value={r.status} />
                              </div>
                              <p>
                                {agent
                                  ? `Cliente: ${r.clientName}`
                                  : `Placa ${r.plate}`}{" "}
                                · {dateBr(r.startDate)} — {dateBr(r.endDate)}
                              </p>
                              <small>
                                Solicitado em {r.createdAt}
                                {r.agentName &&
                                  ` · Analisado por ${r.agentName}`}
                              </small>
                              {r.reviewNotes && (
                                <p className="review-note">
                                  Parecer: {r.reviewNotes}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="rental-side">
                            <strong>{money(rentalTotal(r))}</strong>
                            <small>valor estimado</small>
                            <div className="rental-actions">
                              {agent ? (
                                <>
                                  {["PENDING", "UNDER_REVIEW"].includes(
                                    r.status,
                                  ) && (
                                    <button
                                      className="mini-primary"
                                      onClick={() => setReviewing(r)}
                                    >
                                      Avaliar <ArrowRight size={15} />
                                    </button>
                                  )}
                                  {r.status === "APPROVED" && (
                                    <button
                                      className="mini-primary"
                                      onClick={() => setContracting(r)}
                                    >
                                      Gerar contrato <FileText size={15} />
                                    </button>
                                  )}
                                  {![
                                    "CANCELLED",
                                    "REJECTED",
                                    "CONTRACTED",
                                  ].includes(r.status) && (
                                    <button
                                      className="icon-action"
                                      title="Modificar pedido"
                                      onClick={() => editRental(r)}
                                    >
                                      <SlidersHorizontal size={17} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  {r.status === "PENDING" && (
                                    <button
                                      className="icon-action"
                                      title="Modificar pedido"
                                      onClick={() => editRental(r)}
                                    >
                                      <SlidersHorizontal size={17} />
                                    </button>
                                  )}
                                  {[
                                    "PENDING",
                                    "UNDER_REVIEW",
                                    "APPROVED",
                                  ].includes(r.status) && (
                                    <button
                                      className="mini-danger"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "Cancelar este pedido de aluguel?",
                                          )
                                        )
                                          void perform(
                                            () =>
                                              api(`/rentals/${r.id}/cancel`, {
                                                method: "PATCH",
                                              }),
                                            "Pedido cancelado.",
                                          );
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={<ClipboardList />}
                      heading="Nenhum pedido encontrado"
                      description={
                        rentals.length
                          ? "Tente mudar os filtros."
                          : "Os pedidos aparecerão aqui após serem criados."
                      }
                    />
                  )}
                </>
              )}

              {page === "profile" && profile && (
                <>
                  <PageHeading
                    eyebrow="DADOS DO CONTRATANTE"
                    title="Seu cadastro"
                    subtitle="Mantenha seus dados atualizados para a análise dos pedidos."
                    action={
                      <button
                        className="primary-button"
                        onClick={() => setEditProfile(true)}
                      >
                        <SlidersHorizontal size={17} /> Editar dados
                      </button>
                    }
                  />
                  <div className="profile-grid">
                    <section className="panel">
                      <div className="panel-heading">
                        <h2>Dados pessoais</h2>
                        <span className="soft-badge">
                          <BadgeCheck size={15} /> Cadastrado
                        </span>
                      </div>
                      <div className="details-grid">
                        <Detail
                          label="Nome completo"
                          value={profile.fullName}
                        />
                        <Detail label="CPF" value={profile.cpf} />
                        <Detail label="RG" value={profile.rg} />
                        <Detail label="Profissão" value={profile.profession} />
                        <Detail label="Endereço" value={profile.address} />
                      </div>
                    </section>
                    <section className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Vínculos empregatícios</h2>
                          <p>Até 3 empregadores e rendimentos mensais.</p>
                        </div>
                        {profile.employments.length < 3 && (
                          <button
                            className="outline-button"
                            onClick={() =>
                              setEmployerDialog({
                                id: null,
                                employer: "",
                                monthlyIncome: "",
                              })
                            }
                          >
                            <Plus size={16} /> Adicionar
                          </button>
                        )}
                      </div>
                      {profile.employments.length ? (
                        profile.employments.map((item) => (
                          <div className="employer-row" key={item.id}>
                            <span className="employer-icon">
                              <Wallet size={20} />
                            </span>
                            <div>
                              <strong>{item.employer}</strong>
                              <small>
                                {money(Number(item.monthlyIncome))} por mês
                              </small>
                            </div>
                            <button
                              className="icon-action"
                              title="Editar empregador"
                              onClick={() =>
                                setEmployerDialog({
                                  id: item.id,
                                  employer: item.employer,
                                  monthlyIncome: String(item.monthlyIncome),
                                })
                              }
                            >
                              <SlidersHorizontal size={16} />
                            </button>
                            <button
                              className="icon-action danger"
                              title="Excluir empregador"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Excluir esse vínculo empregatício?",
                                  )
                                )
                                  void perform(
                                    () =>
                                      api(
                                        `/clients/me/employments/${item.id}`,
                                        { method: "DELETE" },
                                      ),
                                    "Empregador removido.",
                                  );
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <Empty
                          icon={<Wallet />}
                          heading="Sem vínculos cadastrados"
                          description="Adicione seus empregadores e rendimentos para completar seu perfil."
                        />
                      )}
                    </section>
                  </div>
                  <section className="delete-account">
                    <div>
                      <strong>Excluir cadastro</strong>
                      <p>
                        Disponível somente para clientes sem histórico de
                        pedidos.
                      </p>
                    </div>
                    <button
                      className="outline-button danger"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Excluir permanentemente sua conta? Esta ação não pode ser desfeita.",
                          )
                        )
                          void perform(
                            () =>
                              api("/clients/me", { method: "DELETE" }).then(
                                onLogout,
                              ),
                            "Cadastro excluído.",
                          );
                      }}
                    >
                      <Trash2 size={16} /> Excluir conta
                    </button>
                  </section>
                </>
              )}

              {page === "clients" && (
                <>
                  <PageHeading
                    eyebrow="DADOS CADASTRAIS"
                    title="Clientes"
                    subtitle="Consulte a identificação e o perfil financeiro dos contratantes."
                  />
                  <Toolbar
                    search={search}
                    setSearch={setSearch}
                    placeholder="Buscar por nome ou CPF"
                  />
                  <div className="panel table-panel">
                    <table>
                      <thead>
                        <tr>
                          <th>CLIENTE</th>
                          <th>CPF</th>
                          <th>PROFISSÃO</th>
                          <th>ENDEREÇO</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients
                          .filter((c) =>
                            `${c.fullName} ${c.cpf}`
                              .toLowerCase()
                              .includes(search.toLowerCase()),
                          )
                          .map((c) => (
                            <tr key={c.id}>
                              <td>
                                <span className="client-avatar">
                                  {c.fullName[0]}
                                </span>
                                <strong>{c.fullName}</strong>
                              </td>
                              <td>{c.cpf}</td>
                              <td>{c.profession}</td>
                              <td>{c.address}</td>
                              <td>
                                <button
                                  className="text-action"
                                  onClick={() => {
                                    void api<Client>(`/clients/${c.id}`)
                                      .then(setSelectedClient)
                                      .catch((e) => notify(String(e), true));
                                  }}
                                >
                                  Detalhes <ArrowRight size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {!clients.length && (
                      <Empty
                        icon={<Users />}
                        heading="Nenhum cliente cadastrado"
                        description="Os cadastros aparecerão aqui."
                      />
                    )}
                  </div>
                </>
              )}

              {page === "contracts" && (
                <>
                  <PageHeading
                    eyebrow="DOCUMENTOS"
                    title="Contratos de aluguel"
                    subtitle="Contratos emitidos após aprovação financeira dos pedidos."
                  />
                  {contracts.length ? (
                    <div className="contract-grid">
                      {contracts.map((contract) => (
                        <div className="panel contract-card" key={contract.id}>
                          <span className="contract-icon">
                            <FileCheck2 size={25} />
                          </span>
                          <span className="soft-badge">
                            <Check size={14} /> Ativo
                          </span>
                          <h2>{contract.model}</h2>
                          <p>{contract.clientName}</p>
                          <div className="contract-rule" />
                          <Detail
                            label="Assinado em"
                            value={contract.signedAt}
                          />
                          <Detail
                            label="Crédito associado"
                            value={
                              contract.principal
                                ? `${money(contract.principal)} em ${contract.installments} parcelas`
                                : "Não"
                            }
                          />
                          {contract.bankName && (
                            <Detail label="Banco" value={contract.bankName} />
                          )}
                          <small>
                            Contrato {contract.id.slice(0, 8).toUpperCase()}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      icon={<FileText />}
                      heading="Nenhum contrato emitido"
                      description="Pedidos aprovados podem ser convertidos em contratos por um agente."
                    />
                  )}
                </>
              )}
            </>
          )}
          <footer className="content-footer">
            AlugaMais · Laboratório 02 — DIAW{" "}
            <span>Engenharia de Software · PUC Minas</span>
          </footer>
        </main>
      </div>

      {rentalDraft && (
        <RentalModal
          draft={rentalDraft}
          setDraft={setRentalDraft}
          vehicles={vehicles}
          editing={!!editingRental}
          busy={busy}
          onClose={() => setRentalDraft(null)}
          onSubmit={async () => {
            const success = await perform(
              () =>
                api(editingRental ? `/rentals/${editingRental}` : "/rentals", {
                  method: editingRental ? "PUT" : "POST",
                  body: JSON.stringify(rentalDraft),
                }),
              editingRental
                ? "Pedido atualizado."
                : "Pedido enviado para análise!",
            );
            if (success) {
              setRentalDraft(null);
              navigate("rentals");
            }
          }}
        />
      )}
      {reviewing && (
        <ReviewModal
          rental={reviewing}
          busy={busy}
          onClose={() => setReviewing(null)}
          onSubmit={async (status, reviewNotes) => {
            const success = await perform(
              () =>
                api(`/rentals/${reviewing.id}/review`, {
                  method: "PATCH",
                  body: JSON.stringify({ status, reviewNotes }),
                }),
              "Parecer registrado.",
            );
            if (success) setReviewing(null);
          }}
        />
      )}
      {contracting && (
        <ContractModal
          rental={contracting}
          banks={banks}
          busy={busy}
          onClose={() => setContracting(null)}
          onSubmit={async (input) => {
            const success = await perform(
              () =>
                api(`/rentals/${contracting.id}/contract`, {
                  method: "POST",
                  body: JSON.stringify(input),
                }),
              "Contrato emitido com sucesso.",
            );
            if (success) {
              setContracting(null);
              navigate("contracts");
            }
          }}
        />
      )}
      {selectedClient && (
        <Modal
          title="Informações do cliente"
          onClose={() => setSelectedClient(null)}
        >
          <div className="details-grid">
            <Detail label="Nome" value={selectedClient.fullName} />
            <Detail label="CPF" value={selectedClient.cpf} />
            <Detail label="RG" value={selectedClient.rg} />
            <Detail label="Profissão" value={selectedClient.profession} />
            <Detail label="Endereço" value={selectedClient.address} />
          </div>
          <h3>Empregadores</h3>
          {selectedClient.employments?.length ? (
            selectedClient.employments.map((e) => (
              <div className="employer-row" key={e.id}>
                <Wallet size={17} />
                <strong>{e.employer}</strong>
                <span>{money(Number(e.monthlyIncome))}</span>
              </div>
            ))
          ) : (
            <p className="muted">Nenhum empregador cadastrado.</p>
          )}
        </Modal>
      )}
      {editProfile && profile && (
        <ProfileModal
          profile={profile}
          busy={busy}
          onClose={() => setEditProfile(false)}
          onSubmit={async (input) => {
            const success = await perform(
              () =>
                api("/clients/me", {
                  method: "PUT",
                  body: JSON.stringify(input),
                }),
              "Cadastro atualizado.",
            );
            if (success) setEditProfile(false);
          }}
        />
      )}
      {employerDialog && (
        <Modal
          title={employerDialog.id ? "Editar empregador" : "Novo empregador"}
          onClose={() => setEmployerDialog(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const success = await perform(
                () =>
                  api(
                    employerDialog.id
                      ? `/clients/me/employments/${employerDialog.id}`
                      : "/clients/me/employments",
                    {
                      method: employerDialog.id ? "PUT" : "POST",
                      body: JSON.stringify({
                        employer: employerDialog.employer,
                        monthlyIncome: Number(employerDialog.monthlyIncome),
                      }),
                    },
                  ),
                "Vínculo empregatício salvo.",
              );
              if (success) setEmployerDialog(null);
            }}
            className="modal-form"
          >
            <Field
              label="Empregador"
              value={employerDialog.employer}
              onChange={(v) =>
                setEmployerDialog({ ...employerDialog, employer: v })
              }
              required
            />
            <Field
              label="Rendimento mensal (R$)"
              value={employerDialog.monthlyIncome}
              onChange={(v) =>
                setEmployerDialog({ ...employerDialog, monthlyIncome: v })
              }
              type="number"
              required
            />
            <button className="primary-button" type="submit" disabled={busy}>
              Salvar empregador <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Stat({
  label,
  number,
  icon,
  accent,
  note,
}: {
  label: string;
  number: number;
  icon: ReactNode;
  accent: string;
  note: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${accent}`}>{icon}</span>
        <ArrowDownRight size={18} className="stat-decoration" />
      </div>
      <strong>{String(number).padStart(2, "0")}</strong>
      <div className="stat-label">{label}</div>
      <small>{note}</small>
    </div>
  );
}

function PageHeading({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <section className="page-heading">
      <div>
        <span className="kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </section>
  );
}

function Toolbar({
  search,
  setSearch,
  placeholder,
  filter,
  setFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  placeholder: string;
  filter?: string;
  setFilter?: (v: string) => void;
}) {
  return (
    <div className="toolbar">
      <label className="search-box">
        <Search size={18} />
        <input
          type="search"
          aria-label="Buscar"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
        />
      </label>
      {setFilter && (
        <label className="select-box">
          <SlidersHorizontal size={17} />
          <select
            aria-label="Filtrar status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} />
        </label>
      )}
    </div>
  );
}

function Status({ value }: { value: RentalStatus }) {
  return (
    <span className={`status status-${value.toLowerCase()}`}>
      <span className="status-dot" />
      {statusLabels[value]}
    </span>
  );
}

function VehicleCard({
  vehicle,
  index,
  onChoose,
}: {
  vehicle: Vehicle;
  index: number;
  onChoose?: () => void;
}) {
  return (
    <article className="vehicle-card">
      <div className={`vehicle-art vehicle-art-${index % 4}`}>
        <span className="vehicle-type">{vehicle.category}</span>
        <div className="art-ring" />
        <CarFront className="vehicle-drawing" size={104} strokeWidth={1.1} />
        <span className="vehicle-year">{vehicle.manufacturingYear}</span>
      </div>
      <div className="vehicle-body">
        <div className="vehicle-category">
          {vehicle.brand.toUpperCase()} <span>•</span> {vehicle.plate}
        </div>
        <h2>{vehicle.model}</h2>
        <div className="vehicle-meta">
          <span>
            <Gauge size={15} /> {vehicle.category}
          </span>
          <span>
            <BadgeCheck size={15} />{" "}
            {vehicle.ownerType === "BANK"
              ? "Banco"
              : vehicle.ownerType === "COMPANY"
                ? "Empresa"
                : "Cliente"}
          </span>
          <span>
            <FileText size={15} /> Matrícula {vehicle.registration}
          </span>
          <span>
            <UserRound size={15} /> {vehicle.ownerName}
          </span>
        </div>
        <div className="vehicle-divider" />
        <div className="vehicle-bottom">
          <div>
            <strong>{money(Number(vehicle.dailyRate))}</strong>
            <small>/ diária</small>
          </div>
          {onChoose && (
            <button
              className="round-button"
              aria-label={`Solicitar ${vehicle.model}`}
              onClick={onChoose}
            >
              <ArrowRight size={21} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="detail">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
function Empty({
  icon,
  heading,
  description,
}: {
  icon: ReactNode;
  heading: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{heading}</strong>
      <p>{description}</p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="modal-header">
          <h2>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function RentalModal({
  draft,
  setDraft,
  vehicles,
  editing,
  busy,
  onClose,
  onSubmit,
}: {
  draft: RentalDraft;
  setDraft: (value: RentalDraft) => void;
  vehicles: Vehicle[];
  editing: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
}) {
  const selected = vehicles.find((v) => v.id === draft.vehicleId);
  const valid =
    draft.vehicleId &&
    draft.startDate >= today() &&
    draft.endDate > draft.startDate;
  const total =
    selected && draft.startDate && draft.endDate
      ? rentalTotal({
          dailyRate: selected.dailyRate,
          startDate: draft.startDate,
          endDate: draft.endDate,
        })
      : 0;
  return (
    <Modal
      title={editing ? "Modificar pedido" : "Solicitar aluguel"}
      onClose={onClose}
    >
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit();
        }}
      >
        <p className="muted">
          Escolha um automóvel e informe o período desejado.
        </p>
        <div className="field">
          <label htmlFor="rental-vehicle">Veículo</label>
          <select
            id="rental-vehicle"
            value={draft.vehicleId}
            onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
            required
          >
            <option value="">Selecione um veículo</option>
            {vehicles.map((v) => (
              <option value={v.id} key={v.id}>
                {v.brand} {v.model} — {money(Number(v.dailyRate))}/dia
              </option>
            ))}
          </select>
        </div>
        <div className="form-two">
          <Field
            label="Data de retirada"
            value={draft.startDate}
            onChange={(v) => setDraft({ ...draft, startDate: v })}
            type="date"
            required
          />
          <Field
            label="Data de devolução"
            value={draft.endDate}
            onChange={(v) => setDraft({ ...draft, endDate: v })}
            type="date"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rental-notes">Observações (opcional)</label>
          <textarea
            id="rental-notes"
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            maxLength={500}
            placeholder="Alguma informação importante sobre o pedido?"
          />
        </div>
        <div className="rental-total">
          <span>Valor estimado do aluguel</span>
          <strong>{money(total)}</strong>
        </div>
        <button
          className="primary-button"
          type="submit"
          disabled={!valid || busy}
        >
          {busy
            ? "Salvando..."
            : editing
              ? "Salvar alterações"
              : "Enviar solicitação"}{" "}
          <ArrowRight size={17} />
        </button>
      </form>
    </Modal>
  );
}

function ReviewModal({
  rental,
  busy,
  onClose,
  onSubmit,
}: {
  rental: Rental;
  busy: boolean;
  onClose: () => void;
  onSubmit: (status: RentalStatus, notes: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<RentalStatus>("APPROVED");
  const [notes, setNotes] = useState("");
  return (
    <Modal title="Avaliação financeira" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(status, notes);
        }}
      >
        <div className="review-summary">
          <CarFront size={25} />
          <div>
            <strong>
              {rental.brand} {rental.model}
            </strong>
            <small>
              Cliente: {rental.clientName} · {money(rentalTotal(rental))}
            </small>
          </div>
        </div>
        <div className="field">
          <label htmlFor="review-status">Parecer financeiro</label>
          <select
            id="review-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RentalStatus)}
          >
            <option value="UNDER_REVIEW">Manter em análise</option>
            <option value="APPROVED">Aprovar solicitação</option>
            <option value="REJECTED">Rejeitar solicitação</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="review-notes">Justificativa / observações</label>
          <textarea
            id="review-notes"
            rows={4}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Registre o resultado da análise financeira..."
            required
          />
        </div>
        <button
          type="submit"
          className="primary-button"
          disabled={busy || !notes.trim()}
        >
          Registrar parecer <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}

function ContractModal({
  rental,
  banks,
  busy,
  onClose,
  onSubmit,
}: {
  rental: Rental;
  banks: Bank[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: {
    credit: boolean;
    bankAgentId?: string;
    principal?: number;
    installments?: number;
  }) => Promise<void>;
}) {
  const [credit, setCredit] = useState(false);
  const [bankAgentId, setBankAgentId] = useState("");
  const [principal, setPrincipal] = useState("");
  const [installments, setInstallments] = useState("12");
  return (
    <Modal title="Formalizar contrato" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit({
            credit,
            ...(credit
              ? {
                  bankAgentId,
                  principal: Number(principal),
                  installments: Number(installments),
                }
              : {}),
          });
        }}
      >
        <div className="review-summary">
          <FileText size={24} />
          <div>
            <strong>
              {rental.brand} {rental.model}
            </strong>
            <small>Pedido aprovado · {rental.clientName}</small>
          </div>
        </div>
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={credit}
            onChange={(e) => setCredit(e.target.checked)}
          />{" "}
          Associar contrato de crédito bancário
        </label>
        {credit && (
          <>
            {!banks.length && (
              <div className="inline-error">
                Cadastre um agente do tipo banco antes de associar crédito.
              </div>
            )}
            <div className="field">
              <label htmlFor="bank">Banco concedente</label>
              <select
                id="bank"
                value={bankAgentId}
                onChange={(e) => setBankAgentId(e.target.value)}
                required
              >
                <option value="">Selecione o banco</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-two">
              <Field
                label="Crédito (R$)"
                value={principal}
                onChange={setPrincipal}
                type="number"
                required
              />
              <Field
                label="Número de parcelas"
                value={installments}
                onChange={setInstallments}
                type="number"
                required
              />
            </div>
          </>
        )}
        <button
          className="primary-button"
          type="submit"
          disabled={
            busy ||
            (credit &&
              (!banks.length ||
                !bankAgentId ||
                Number(principal) <= 0 ||
                Number(installments) < 1))
          }
        >
          Confirmar contrato <FileCheck2 size={17} />
        </button>
      </form>
    </Modal>
  );
}

function ProfileModal({
  profile,
  busy,
  onClose,
  onSubmit,
}: {
  profile: Client;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<Client, "id" | "employments">) => Promise<void>;
}) {
  const [form, setForm] = useState({
    fullName: profile.fullName,
    cpf: profile.cpf,
    rg: profile.rg,
    address: profile.address,
    profession: profile.profession,
  });
  const update = (name: keyof typeof form, value: string) =>
    setForm({ ...form, [name]: value });
  return (
    <Modal title="Editar cadastro" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(form);
        }}
      >
        <Field
          label="Nome completo"
          value={form.fullName}
          onChange={(v) => update("fullName", v)}
          required
        />
        <div className="form-two">
          <Field
            label="CPF"
            value={form.cpf}
            onChange={(v) => update("cpf", v.replace(/\D/g, "").slice(0, 11))}
            required
          />
          <Field
            label="RG"
            value={form.rg}
            onChange={(v) => update("rg", v)}
            required
          />
        </div>
        <Field
          label="Endereço"
          value={form.address}
          onChange={(v) => update("address", v)}
          required
        />
        <Field
          label="Profissão"
          value={form.profession}
          onChange={(v) => update("profession", v)}
          required
        />
        <button className="primary-button" type="submit" disabled={busy}>
          Salvar informações <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
