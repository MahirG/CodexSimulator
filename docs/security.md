# Security model

## Trust boundaries

- The web client is untrusted for shell, filesystem, Git credentials, and cloud credentials.
- The cloud service stores workspace metadata, policy, event history, and approvals; it does not store raw local shell credentials.
- The desktop bridge is a trusted local capability broker with a narrow, authenticated API.
- Coding agents operate inside per-repository sandboxes or isolated worktrees.

## Approval requirements

Every approval must show:

- exact command or tool action
- repository, environment, and working directory
- affected files or resources
- network access requirement
- reversibility
- risk classification
- expiry and one-time scope

Separate stronger confirmation is required for production deployment, destructive SQL, secret changes, force push, deleting resources, privilege escalation, or commands outside the repository root.

## Bridge protocol

Recommended controls:

- pairing with a short-lived one-time code
- device public-key registration
- signed command envelopes with nonce and expiry
- replay protection
- strict allowlist for action types
- sandboxed process execution
- output truncation and secret redaction
- rate limits and connection lockout
- revocable device sessions
- append-only audit events

## Database controls

The included Supabase migration enables row-level security on all application tables. Workspace membership is checked through security-definer helper functions. High-risk approval decisions are restricted to workspace owners and administrators.
