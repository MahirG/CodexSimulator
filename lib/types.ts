export type AgentStatus =
  | "unassigned"
  | "idle"
  | "thinking"
  | "complete"
  | "requires_input"
  | "error";

export type ReasoningLevel = "low" | "medium" | "high" | "max";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AgentSession {
  id: string;
  name: string;
  objective: string;
  repository: string;
  branch: string;
  status: AgentStatus;
  progress: number;
  elapsed: string;
  filesChanged: number;
  additions: number;
  deletions: number;
  lastEvent: string;
  unread: boolean;
  reasoning: ReasoningLevel;
}

export interface ActivityEvent {
  id: string;
  agentId: string | null;
  type: string;
  message: string;
  timestamp: string;
  severity: "neutral" | "success" | "warning" | "danger";
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  title: string;
  detail: string;
  command: string;
  scope: string;
  reversible: boolean;
  networkAccess: boolean;
  risk: RiskLevel;
  createdAt: string;
}

export interface WorkflowStep {
  id: string;
  label: string;
  type: "agent" | "git" | "test" | "approval" | "deploy";
  state: "complete" | "running" | "queued" | "blocked";
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  runs: number;
  successRate: number;
  steps: WorkflowStep[];
}
