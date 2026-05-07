-- A2A Protocol Nodes — Supabase DDL
-- Run this migration in your Supabase project to create all A2A tables.
-- Tables are in a separate a2a_* namespace — no modification to existing tables.

CREATE TABLE IF NOT EXISTS a2a_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capabilities JSONB DEFAULT '[]',
  mcp_endpoints JSONB DEFAULT '[]',
  artifact_types JSONB DEFAULT '[]',
  owner_id UUID NOT NULL,
  status TEXT DEFAULT 'idle',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2a_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  requester_id UUID NOT NULL,
  assignee_id UUID,
  artifact_ids JSONB DEFAULT '[]',
  session_id UUID,
  result JSONB,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_a2a_tasks_status ON a2a_tasks(status);

CREATE TABLE IF NOT EXISTS a2a_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_a2a_messages_task ON a2a_messages(task_id);

CREATE TABLE IF NOT EXISTS a2a_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL,
  owner_id UUID NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2a_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  participants JSONB DEFAULT '[]',
  status TEXT DEFAULT 'open',
  decision TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS a2a_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  claim TEXT NOT NULL,
  evidence JSONB DEFAULT '[]',
  confidence REAL DEFAULT 1.0,
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_a2a_claims_session ON a2a_claims(session_id);

CREATE TABLE IF NOT EXISTS a2a_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT,
  based_on_claims JSONB DEFAULT '[]',
  agreed_by JSONB DEFAULT '[]',
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_a2a_decisions_session ON a2a_decisions(session_id);

CREATE TABLE IF NOT EXISTS a2a_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  observation TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_a2a_observations_session ON a2a_observations(session_id);
