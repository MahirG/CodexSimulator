# Agent Command Deck architecture

## Product surfaces

1. **Quick Deck** provides low-latency controls, live agent status, reasoning effort, voice, approvals, and workflow launchers.
2. **Agent Workbench** provides the context the hardware surface cannot show: objective, repository, branch, files changed, progress, errors, and approval rationale.
3. **Workflow Builder** represents reusable multi-step operations with conditions, retries, validation, and human approval gates.

## Runtime topology

```text
Browser / installed PWA
        |
        | HTTPS + authenticated realtime channel
        v
Next.js application + Supabase
        |
        | short-lived pairing token + signed commands
        v
Local desktop bridge
        |
        +-- Codex App Server / SDK
        +-- Git worktrees and repository metadata
        +-- sandboxed command runner
        +-- local secret store
```

The browser never receives unrestricted filesystem, shell, or credential access. The local bridge owns these capabilities and verifies every command envelope.

## Event envelope

```json
{
  "eventId": "evt_123",
  "workspaceId": "ws_123",
  "agentId": "agent_123",
  "type": "agent.requires_input",
  "timestamp": "2026-07-20T10:30:00Z",
  "severity": "warning",
  "payload": {
    "reason": "Permission required to apply a migration",
    "command": "supabase db push",
    "scope": "development",
    "risk": "high"
  }
}
```

The same normalized event updates the deck indicator, activity stream, notification center, approval queue, and audit trail.

## Delivery stages

- Stage 1: production UI and typed simulator (implemented here)
- Stage 2: Supabase authentication, storage, and realtime subscriptions
- Stage 3: authenticated local bridge and pairing
- Stage 4: Codex session lifecycle, Git operations, diffs, tests, and pull requests
- Stage 5: workflow editor, team controls, mobile notifications, and optional hardware adapters
