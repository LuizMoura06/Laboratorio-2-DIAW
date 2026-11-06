export type Role = "CLIENT" | "AGENT";
export type Session = {
  token: string;
  username: string;
  role: Role;
  name: string;
};
export type Vehicle = {
  id: string;
  registration: string;
  manufacturingYear: number;
  brand: string;
  model: string;
  plate: string;
  ownerType: "CLIENT" | "COMPANY" | "BANK";
  ownerName: string;
  dailyRate: number;
  category: string;
};
export type Employment = {
  id: string;
  employer: string;
  monthlyIncome: number;
  position: number;
};
export type Client = {
  id: string;
  fullName: string;
  cpf: string;
  rg: string;
  address: string;
  profession: string;
  employments: Employment[];
};
export type RentalStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CONTRACTED";
export type Rental = {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  brand: string;
  model: string;
  plate: string;
  dailyRate: number;
  startDate: string;
  endDate: string;
  notes: string | null;
  reviewNotes: string | null;
  status: RentalStatus;
  agentName: string | null;
  createdAt: string;
};
export type Contract = {
  id: string;
  rentalId: string;
  clientName: string;
  model: string;
  signedAt: string;
  principal: number | null;
  installments: number | null;
  bankName: string | null;
};
export type Bank = { id: string; name: string; cnpj: string };

const BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:8080/api"
).replace(/\/$/, "");

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem("alugamais:session");
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (session)
    sessionStorage.setItem("alugamais:session", JSON.stringify(session));
  else sessionStorage.removeItem("alugamais:session");
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  session = loadSession(),
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique se o servidor Spring Boot está em execução.",
    );
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : `Erro HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export const statusLabels: Record<RentalStatus, string> = {
  PENDING: "Pendente",
  UNDER_REVIEW: "Em análise",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  CANCELLED: "Cancelado",
  CONTRACTED: "Contratado",
};

export const dateBr = (value: string) => {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

export const rentalTotal = (
  rental: Pick<Rental, "startDate" | "endDate" | "dailyRate">,
) => {
  const days =
    (Date.parse(rental.endDate) - Date.parse(rental.startDate)) / 86400000;
  return Math.max(0, days) * Number(rental.dailyRate);
};
