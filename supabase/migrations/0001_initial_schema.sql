create extension if not exists "pgcrypto";

create type public.workspace_role as enum ('owner', 'admin', 'developer', 'viewer');
create type public.agent_status as enum ('unassigned', 'idle', 'thinking', 'complete', 'requires_input', 'error');
create type public.risk_level as enum ('low', 'medium', 'high', 'critical');
create type public.approval_state as enum ('pending', 'approved', 'declined', 'expired', 'cancelled');
create type public.workflow_run_state as enum ('queued', 'running', 'waiting', 'complete', 'failed', 'cancelled');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'developer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null default 'github',
  external_id text,
  full_name text not null,
  default_branch text not null default 'main',
  installation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, full_name)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  device_type text not null check (device_type in ('web', 'mobile', 'desktop_bridge', 'hardware')),
  public_key text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.agent_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  repository_id uuid references public.repositories(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  objective text not null,
  branch text,
  provider text not null default 'codex',
  external_session_id text,
  status public.agent_status not null default 'idle',
  reasoning_effort text not null default 'medium' check (reasoning_effort in ('low', 'medium', 'high', 'max')),
  fast_mode boolean not null default false,
  progress smallint not null default 0 check (progress between 0 and 100),
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agent_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_session_id uuid references public.agent_sessions(id) on delete cascade,
  event_type text not null,
  severity text not null default 'neutral' check (severity in ('neutral', 'success', 'warning', 'danger')),
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.deck_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  layout jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  description text not null default '',
  trigger_type text not null default 'manual',
  definition jsonb not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  workflow_template_id uuid references public.workflow_templates(id) on delete set null,
  initiated_by uuid references auth.users(id) on delete set null,
  state public.workflow_run_state not null default 'queued',
  current_step text,
  context jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.approval_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_session_id uuid references public.agent_sessions(id) on delete cascade,
  workflow_run_id uuid references public.workflow_runs(id) on delete cascade,
  requested_by text not null,
  title text not null,
  detail text not null,
  command text,
  scope text not null,
  risk public.risk_level not null,
  reversible boolean not null default false,
  network_access boolean not null default false,
  state public.approval_state not null default 'pending',
  decided_by uuid references auth.users(id) on delete set null,
  decision_note text,
  expires_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.command_executions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_session_id uuid references public.agent_sessions(id) on delete set null,
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  command text not null,
  working_directory text,
  exit_code integer,
  stdout_summary text,
  stderr_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_device_id uuid references public.devices(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  risk public.risk_level,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index agent_events_workspace_time_idx on public.agent_events (workspace_id, occurred_at desc);
create index agent_sessions_workspace_status_idx on public.agent_sessions (workspace_id, status);
create index approval_requests_pending_idx on public.approval_requests (workspace_id, state, created_at desc);
create index audit_logs_workspace_time_idx on public.audit_logs (workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id and wm.user_id = auth.uid()
  ) or exists (
    select 1 from public.workspaces w
    where w.id = target_workspace_id and w.owner_id = auth.uid()
  );
$$;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id = target_workspace_id and w.owner_id = auth.uid()
  ) or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.repositories enable row level security;
alter table public.devices enable row level security;
alter table public.agent_sessions enable row level security;
alter table public.agent_events enable row level security;
alter table public.deck_profiles enable row level security;
alter table public.workflow_templates enable row level security;
alter table public.workflow_runs enable row level security;
alter table public.approval_requests enable row level security;
alter table public.command_executions enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy "workspace members can read workspaces" on public.workspaces for select using (public.is_workspace_member(id));
create policy "owners can update workspaces" on public.workspaces for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "users can create workspaces" on public.workspaces for insert with check (owner_id = auth.uid());
create policy "workspace members can read memberships" on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy "workspace admins manage memberships" on public.workspace_members for all using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "members read repositories" on public.repositories for select using (public.is_workspace_member(workspace_id));
create policy "developers manage repositories" on public.repositories for all using (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));
create policy "members read devices" on public.devices for select using (public.is_workspace_member(workspace_id));
create policy "users manage own devices" on public.devices for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

create policy "members read agents" on public.agent_sessions for select using (public.is_workspace_member(workspace_id));
create policy "developers manage agents" on public.agent_sessions for all using (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));
create policy "members read agent events" on public.agent_events for select using (public.is_workspace_member(workspace_id));
create policy "developers create agent events" on public.agent_events for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));

create policy "users manage deck profiles" on public.deck_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));
create policy "members read workflows" on public.workflow_templates for select using (public.is_workspace_member(workspace_id));
create policy "developers manage workflows" on public.workflow_templates for all using (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));
create policy "members read workflow runs" on public.workflow_runs for select using (public.is_workspace_member(workspace_id));
create policy "developers manage workflow runs" on public.workflow_runs for all using (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));

create policy "members read approvals" on public.approval_requests for select using (public.is_workspace_member(workspace_id));
create policy "developers request approvals" on public.approval_requests for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));
create policy "admins decide high-risk approvals" on public.approval_requests for update using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "members read executions" on public.command_executions for select using (public.is_workspace_member(workspace_id));
create policy "developers create executions" on public.command_executions for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));

create policy "users read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "members read audit logs" on public.audit_logs for select using (public.is_workspace_member(workspace_id));
create policy "developers create audit logs" on public.audit_logs for insert with check (public.has_workspace_role(workspace_id, array['owner','admin','developer']::public.workspace_role[]));

alter publication supabase_realtime add table public.agent_sessions;
alter publication supabase_realtime add table public.agent_events;
alter publication supabase_realtime add table public.approval_requests;
alter publication supabase_realtime add table public.notifications;
