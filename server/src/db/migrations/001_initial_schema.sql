CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leads (
  id             SERIAL PRIMARY KEY,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  insurance_type TEXT NOT NULL
    CHECK (insurance_type IN ('car', 'home', 'travel', 'mortgage', 'health_life')),
  status         TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'in_progress', 'callback', 'quote_sent', 'won', 'lost')),
  agent_id       INTEGER REFERENCES users (id) ON DELETE SET NULL,
  consent_at     TIMESTAMPTZ NOT NULL,
  callback_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_agent_id_idx ON leads (agent_id);
CREATE INDEX leads_status_idx ON leads (status);
CREATE INDEX leads_phone_idx ON leads (phone);

CREATE TABLE lead_notes (
  id         SERIAL PRIMARY KEY,
  lead_id    INTEGER NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  -- NULL author means the note was written by the system (for example a duplicate submission).
  author_id  INTEGER REFERENCES users (id) ON DELETE SET NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX lead_notes_lead_id_idx ON lead_notes (lead_id);

-- Keeps leads.updated_at current on every UPDATE.
CREATE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
