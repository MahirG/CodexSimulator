# Agent Command Deck

A web-first software control surface for supervising parallel coding agents. It translates the useful interaction model of dedicated AI control hardware into an installable PWA with richer context, safer approvals, responsive layouts, and a path to real Codex, GitHub, and Supabase integration.

## Included in this foundation

- hardware-inspired Quick Deck with six live agent keys
- official-style agent lifecycle: idle, thinking, complete, requires input, error, and unassigned
- reasoning-effort dial and fast-mode control
- approve, decline, continue, push-to-talk, and send actions
- four-direction workflow joystick
- Agent Workbench with objective, repository, branch, progress, diff, and recovery controls
- Approval Center showing exact command, scope, reversibility, network access, and risk
- Workflow Builder views with validation and approval stages
- live activity/event console
- responsive desktop, tablet, and mobile interface
- dark and light appearance
- installable PWA manifest and service worker
- health endpoint and SSE event-stream foundation
- Supabase browser/server clients
- complete initial PostgreSQL schema, indexes, RLS policies, and realtime publication
- architecture and security documentation

## Start locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The current UI uses typed mock data so it works before Supabase and the local bridge are configured.

## Validate

```bash
npm run typecheck
npm run lint
npm run build
```

## Supabase

1. Create or select a Supabase project.
2. Add the project URL and publishable key to `.env.local`.
3. Apply `supabase/migrations/0001_initial_schema.sql` with the Supabase CLI or SQL editor.
4. Add authentication screens and seed the first workspace.
5. Replace the typed simulator with subscriptions to `agent_sessions`, `agent_events`, `approval_requests`, and `notifications`.

Never expose a Supabase service-role key in `NEXT_PUBLIC_*` variables.

## Local bridge roadmap

The local bridge should be a separate signed desktop process. It will pair with the web app, connect to Codex App Server or SDK, manage Git worktrees, stream logs, and execute only approved commands. See `docs/architecture.md` and `docs/security.md`.

## Project status

This repository contains the production-quality Phase 1 foundation and Phase 2 database design. Real agent execution and local shell/Git access are intentionally not faked; they require the authenticated bridge described in the documentation.

## Branding

Use a distinct product name and describe compatibility factually. Do not imply that this application is an official OpenAI device or an endorsed replacement.
