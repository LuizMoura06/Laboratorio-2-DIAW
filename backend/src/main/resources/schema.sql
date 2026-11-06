CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role VARCHAR(12) NOT NULL CHECK (role IN ('CLIENT','AGENT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  rg VARCHAR(25) NOT NULL,
  address VARCHAR(250) NOT NULL,
  profession VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS employments (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employer VARCHAR(150) NOT NULL,
  monthly_income NUMERIC(12,2) NOT NULL CHECK (monthly_income >= 0),
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
  UNIQUE(client_id, position)
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  agent_type VARCHAR(12) NOT NULL CHECK (agent_type IN ('BANK','COMPANY')),
  cnpj VARCHAR(14) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY,
  registration VARCHAR(40) NOT NULL UNIQUE,
  manufacturing_year INTEGER NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(120) NOT NULL,
  plate VARCHAR(10) NOT NULL UNIQUE,
  owner_type VARCHAR(12) NOT NULL CHECK (owner_type IN ('CLIENT','COMPANY','BANK')),
  owner_name VARCHAR(150) NOT NULL,
  daily_rate NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0),
  category VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS rental_requests (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  agent_id UUID REFERENCES agents(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes VARCHAR(500),
  review_notes VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','UNDER_REVIEW','APPROVED','REJECTED','CANCELLED','CONTRACTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS rental_contracts (
  id UUID PRIMARY KEY,
  rental_id UUID NOT NULL UNIQUE REFERENCES rental_requests(id),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_agreements (
  id UUID PRIMARY KEY,
  contract_id UUID NOT NULL UNIQUE REFERENCES rental_contracts(id),
  bank_agent_id UUID NOT NULL REFERENCES agents(id),
  principal NUMERIC(12,2) NOT NULL CHECK (principal > 0),
  installments INTEGER NOT NULL CHECK (installments BETWEEN 1 AND 120)
);

CREATE TABLE IF NOT EXISTS session_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_rentals_client ON rental_requests(client_id);
CREATE INDEX IF NOT EXISTS ix_rentals_vehicle_period ON rental_requests(vehicle_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS ix_sessions_expiry ON session_tokens(expires_at);

