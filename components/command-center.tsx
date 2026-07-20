"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bell,
  Bot,
  Bug,
  Check,
  ChevronDown,
  Code2,
  Command,
  CornerUpRight,
  Database,
  FileCode2,
  GitBranch,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Mic,
  Moon,
  Network,
  PanelLeftClose,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Square,
  Sun,
  Terminal,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { approvalRequests, workflows } from "@/lib/mock-data";
import type { AgentSession, AgentStatus, ApprovalRequest, ReasoningLevel, Workflow as WorkflowType } from "@/lib/types";
import { useAgentSimulator } from "@/hooks/use-agent-simulator";

const statusMeta: Record<AgentStatus, { label: string; className: string }> = {
  unassigned: { label: "Unassigned", className: "status-unassigned" },
  idle: { label: "Idle", className: "status-idle" },
  thinking: { label: "Thinking", className: "status-thinking" },
  complete: { label: "Complete", className: "status-complete" },
  requires_input: { label: "Requires input", className: "status-input" },
  error: { label: "Error", className: "status-error" },
};

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "agents", label: "Agents", icon: Bot },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "approvals", label: "Approvals", icon: ShieldAlert, count: 1 },
  { id: "activity", label: "Activity", icon: Activity },
] as const;

type ViewId = (typeof navItems)[number]["id"];

export function CommandCenter() {
  const simulator = useAgentSimulator();
  const [view, setView] = useState<ViewId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [composer, setComposer] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
  }, [darkMode]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  const pendingAgent = simulator.agents.find((agent) => agent.status === "requires_input");
  const metrics = useMemo(() => ({
    active: simulator.agents.filter((agent) => agent.status === "thinking").length,
    attention: simulator.agents.filter((agent) => ["requires_input", "error"].includes(agent.status)).length,
    changed: simulator.agents.reduce((total, agent) => total + agent.filesChanged, 0),
  }), [simulator.agents]);

  const sendPrompt = () => {
    const prompt = composer.trim();
    if (!prompt) return;
    simulator.executeCommand(`Prompt sent: ${prompt}`);
    simulator.setAgentStatus(simulator.selectedId, "thinking");
    setComposer("");
  };

  const approveRequest = () => {
    if (!approval) return;
    simulator.setAgentStatus(approval.agentId, "thinking");
    simulator.executeCommand(`Approved: ${approval.title}`, "success");
    setApproval(null);
  };

  const rejectRequest = () => {
    if (!approval) return;
    simulator.setAgentStatus(approval.agentId, "idle");
    simulator.executeCommand(`Declined: ${approval.title}`, "danger");
    setApproval(null);
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
        <div className="brand-row">
          <div className="brand-mark"><Command size={19} /></div>
          {sidebarOpen && <div><strong>Command Deck</strong><span>Agent supervisor</span></div>}
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "nav-item active" : "nav-item"} onClick={() => setView(item.id)} title={item.label}>
                <Icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && "count" in item && item.count ? <b>{item.count}</b> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />
        <div className="bridge-card">
          <span className="online-dot" />
          {sidebarOpen && <div><strong>Local bridge</strong><span>Encrypted · 18 ms</span></div>}
        </div>
        <button className="nav-item" title="Settings"><Settings size={18} />{sidebarOpen && <span>Settings</span>}</button>
        <button className="collapse-button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar"><PanelLeftClose size={17} /></button>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Workspace / MahirG</p>
            <h1>{view === "overview" ? "Agent Command Center" : navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input placeholder="Search agents, files, events" aria-label="Search" /><kbd>⌘ K</kbd></label>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
            <button className="icon-button" aria-label="Toggle theme" onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="avatar-button" aria-label="Account menu">MA</button>
          </div>
        </header>

        <div className="content-scroll">
          {view === "overview" && (
            <>
              <section className="metrics-row" aria-label="Workspace metrics">
                <MetricCard icon={Zap} label="Active agents" value={String(metrics.active)} detail="Running now" />
                <MetricCard icon={ShieldAlert} label="Needs attention" value={String(metrics.attention)} detail="Approval or recovery" tone="warning" />
                <MetricCard icon={FileCode2} label="Files changed" value={String(metrics.changed)} detail="Across six branches" />
                <MetricCard icon={Gauge} label="Success rate" value="94%" detail="Last 30 workflow runs" tone="success" />
              </section>

              <section className="dashboard-grid">
                <div className="panel deck-panel">
                  <PanelHeader eyebrow="Quick Deck" title="Physical control, software context" action={<button className="quiet-button"><Settings size={15} /> Customize</button>} />
                  <QuickDeck
                    agents={simulator.agents}
                    selectedId={simulator.selectedId}
                    onSelect={simulator.selectAgent}
                    onCycle={simulator.cycleAgent}
                    reasoning={simulator.reasoning}
                    onReasoning={simulator.setReasoning}
                    fastMode={simulator.fastMode}
                    onFastMode={() => {
                      simulator.setFastMode(!simulator.fastMode);
                      simulator.executeCommand(`Fast mode ${simulator.fastMode ? "disabled" : "enabled"}`);
                    }}
                    onApprove={() => pendingAgent ? setApproval(approvalRequests[0]) : simulator.executeCommand("No approval is currently pending")}
                    onReject={() => simulator.executeCommand("Current request declined", "danger")}
                    onContinue={() => simulator.executeCommand("Continued in a new agent thread")}
                    onVoice={() => {
                      setVoiceActive((value) => !value);
                      simulator.executeCommand(voiceActive ? "Voice capture stopped" : "Voice capture started");
                    }}
                    voiceActive={voiceActive}
                    onSend={sendPrompt}
                    activeWorkflow={activeWorkflow}
                    onWorkflow={(workflowId) => {
                      setActiveWorkflow(workflowId);
                      simulator.executeCommand(`Workflow launched: ${workflowId}`, "success");
                      window.setTimeout(() => setActiveWorkflow(null), 420);
                    }}
                  />
                </div>

                <div className="panel workbench-panel">
                  <PanelHeader eyebrow="Agent Workbench" title={simulator.selectedAgent.name} action={<StatusPill status={simulator.selectedAgent.status} />} />
                  <AgentWorkbench agent={simulator.selectedAgent} onStatus={simulator.setAgentStatus} onApproval={() => setApproval(approvalRequests[0])} />
                </div>

                <div className="panel activity-panel">
                  <PanelHeader eyebrow="Live stream" title="Activity" action={<span className="live-label"><span /> Realtime</span>} />
                  <ActivityConsole events={simulator.events} agents={simulator.agents} />
                </div>
              </section>

              <section className="composer-panel">
                <div className="composer-agent"><span className={`agent-led ${statusMeta[simulator.selectedAgent.status].className}`} /><div><strong>{simulator.selectedAgent.name}</strong><span>{simulator.selectedAgent.repository}</span></div></div>
                <div className="composer-input"><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") sendPrompt(); }} placeholder="Steer the selected agent…" aria-label="Agent prompt" /><div className="composer-tools"><button title="Attach repository context"><GitBranch size={16} /></button><button title="Attach file"><FileCode2 size={16} /></button><span>⌘ Enter to send</span><button className="send-button" onClick={sendPrompt} aria-label="Send prompt"><Send size={16} /></button></div></div>
              </section>
            </>
          )}

          {view === "agents" && <AgentsView agents={simulator.agents} selectedId={simulator.selectedId} onSelect={simulator.selectAgent} />}
          {view === "workflows" && <WorkflowsView workflows={workflows} onRun={(id) => { setActiveWorkflow(id); simulator.executeCommand(`Workflow queued: ${id}`, "success"); }} />}
          {view === "approvals" && <ApprovalsView requests={approvalRequests} onOpen={setApproval} />}
          {view === "activity" && <div className="panel full-panel"><PanelHeader eyebrow="Audit-ready event stream" title="Workspace activity" /><ActivityConsole events={simulator.events} agents={simulator.agents} expanded /></div>}
        </div>
      </section>

      {approval && <ApprovalModal request={approval} onApprove={approveRequest} onReject={rejectRequest} onClose={() => setApproval(null)} />}
    </main>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone = "default" }: { icon: typeof Zap; label: string; value: string; detail: string; tone?: "default" | "warning" | "success" }) {
  return <article className={`metric-card metric-${tone}`}><div className="metric-icon"><Icon size={18} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function PanelHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="panel-header"><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</div>;
}

function StatusPill({ status }: { status: AgentStatus }) {
  const meta = statusMeta[status];
  return <span className={`status-pill ${meta.className}`}><i />{meta.label}</span>;
}

function QuickDeck(props: {
  agents: AgentSession[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCycle: (id: string) => void;
  reasoning: ReasoningLevel;
  onReasoning: (value: ReasoningLevel) => void;
  fastMode: boolean;
  onFastMode: () => void;
  onApprove: () => void;
  onReject: () => void;
  onContinue: () => void;
  onVoice: () => void;
  voiceActive: boolean;
  onSend: () => void;
  activeWorkflow: string | null;
  onWorkflow: (id: string) => void;
}) {
  const reasoningLevels: ReasoningLevel[] = ["low", "medium", "high", "max"];
  const index = reasoningLevels.indexOf(props.reasoning);
  return (
    <div className="device-wrap">
      <div className="device-shell">
        <div className="device-topline"><span>KBD-SW · CONNECTED</span><span><i /> 18 ms</span></div>
        <div className="device-face">
          <div className="agent-grid">
            {props.agents.map((agent) => (
              <button key={agent.id} className={`agent-key ${props.selectedId === agent.id ? "selected" : ""}`} onClick={() => props.onSelect(agent.id)} onDoubleClick={() => props.onCycle(agent.id)} title="Click to select; double-click to simulate next status">
                <span className={`key-light ${statusMeta[agent.status].className}`} />
                <strong>{agent.name}</strong>
                <small>{statusMeta[agent.status].label}</small>
                {agent.unread && <b className="unread-marker" />}
              </button>
            ))}
            <div className="dial-control">
              <button className="dial" onClick={() => props.onReasoning(reasoningLevels[(index + 1) % reasoningLevels.length])} aria-label="Increase reasoning effort"><span style={{ transform: `rotate(${index * 72 - 70}deg)` }} /></button>
              <strong>{props.reasoning}</strong>
              <button className="dial-lower" onClick={() => props.onReasoning(reasoningLevels[Math.max(0, index - 1)])}><ChevronDown size={12} /> lower</button>
            </div>
          </div>

          <div className="command-grid">
            <DeckButton icon={Zap} label="Fast" active={props.fastMode} onClick={props.onFastMode} />
            <DeckButton icon={Check} label="Approve" tone="success" onClick={props.onApprove} />
            <DeckButton icon={X} label="Decline" tone="danger" onClick={props.onReject} />
            <DeckButton icon={CornerUpRight} label="Continue" onClick={props.onContinue} />
          </div>
          <div className="command-grid lower-row">
            <DeckButton icon={Mic} label={props.voiceActive ? "Listening" : "Push to talk"} active={props.voiceActive} wide onClick={props.onVoice} />
            <DeckButton icon={Send} label="Send" onClick={props.onSend} />
          </div>
        </div>

        <div className="joystick-zone">
          <div className="joystick-base">
            <JoystickAction icon={ListChecks} label="Plan" direction="top" active={props.activeWorkflow === "plan"} onClick={() => props.onWorkflow("plan")} />
            <JoystickAction icon={Bug} label="Debug" direction="right" active={props.activeWorkflow === "debug"} onClick={() => props.onWorkflow("debug")} />
            <JoystickAction icon={RefreshCw} label="Refactor" direction="bottom" active={props.activeWorkflow === "refactor"} onClick={() => props.onWorkflow("refactor")} />
            <JoystickAction icon={GitBranch} label="Review PR" direction="left" active={props.activeWorkflow === "review-pr"} onClick={() => props.onWorkflow("review-pr")} />
            <div className={`joystick-stick ${props.activeWorkflow ? `stick-${props.activeWorkflow}` : ""}`} />
          </div>
          <div><strong>{props.activeWorkflow ? props.activeWorkflow.replace("-", " ") : "Workflows"}</strong><span>Flick a direction to launch</span></div>
        </div>
        <div className="device-signature">LET&apos;S BUILD · SOFTWARE EDITION</div>
      </div>
    </div>
  );
}

function DeckButton({ icon: Icon, label, tone = "default", active = false, wide = false, onClick }: { icon: typeof Zap; label: string; tone?: "default" | "success" | "danger"; active?: boolean; wide?: boolean; onClick: () => void }) {
  return <button className={`deck-button deck-${tone} ${active ? "active" : ""} ${wide ? "wide" : ""}`} onClick={onClick}><Icon size={18} /><span>{label}</span></button>;
}

function JoystickAction({ icon: Icon, label, direction, active, onClick }: { icon: typeof Bug; label: string; direction: "top" | "right" | "bottom" | "left"; active: boolean; onClick: () => void }) {
  return <button className={`joystick-action joystick-${direction} ${active ? "active" : ""}`} onClick={onClick} aria-label={label}><Icon size={15} /><span>{label}</span></button>;
}

function AgentWorkbench({ agent, onStatus, onApproval }: { agent: AgentSession; onStatus: (id: string, status: AgentStatus) => void; onApproval: () => void }) {
  return (
    <div className="workbench-content">
      <div className="objective-card"><span>Current objective</span><p>{agent.objective}</p><div className="progress-track"><i style={{ width: `${agent.progress}%` }} /></div><div className="progress-copy"><span>{agent.progress}% complete</span><span>{agent.elapsed}</span></div></div>
      <dl className="agent-facts">
        <div><dt><GitBranch size={14} /> Repository</dt><dd>{agent.repository}</dd></div>
        <div><dt><Code2 size={14} /> Branch</dt><dd>{agent.branch}</dd></div>
        <div><dt><FileCode2 size={14} /> Diff</dt><dd><b className="plus">+{agent.additions}</b> <b className="minus">−{agent.deletions}</b> · {agent.filesChanged} files</dd></div>
        <div><dt><Sparkles size={14} /> Reasoning</dt><dd>{agent.reasoning}</dd></div>
      </dl>
      <div className="latest-event"><span>Latest event</span><p>{agent.lastEvent}</p></div>
      <div className="workbench-actions">
        {agent.status === "thinking" ? <button onClick={() => onStatus(agent.id, "idle")}><Pause size={15} /> Pause</button> : <button onClick={() => onStatus(agent.id, "thinking")}><Play size={15} /> Resume</button>}
        <button onClick={() => onStatus(agent.id, "thinking")}><RotateCcw size={15} /> Retry</button>
        <button onClick={() => onStatus(agent.id, "idle")}><Square size={14} /> Stop</button>
      </div>
      {agent.status === "requires_input" && <button className="attention-banner" onClick={onApproval}><ShieldAlert size={18} /><span><strong>Approval required</strong><small>Review exact command, scope, and risk</small></span><CornerUpRight size={16} /></button>}
      {agent.status === "error" && <div className="error-banner"><Bug size={18} /><span><strong>Bridge handshake failed</strong><small>Credentials were not exposed. Retry the authenticated local connection.</small></span></div>}
    </div>
  );
}

function ActivityConsole({ events, agents, expanded = false }: { events: ReturnType<typeof useAgentSimulator>["events"]; agents: AgentSession[]; expanded?: boolean }) {
  return <div className={`activity-console ${expanded ? "expanded" : ""}`}>{events.slice(expanded ? -20 : -7).reverse().map((event) => { const agent = agents.find((item) => item.id === event.agentId); return <div className={`event-row event-${event.severity}`} key={event.id}><span>{event.timestamp}</span><i /><div><strong>{agent?.name ?? "System"}</strong><p>{event.message}</p></div></div>; })}</div>;
}

function AgentsView({ agents, selectedId, onSelect }: { agents: AgentSession[]; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="view-stack"><div className="view-heading"><div><span>Parallel execution</span><h2>Agent sessions</h2><p>Inspect every delegated task, branch, status, and risk signal.</p></div><button className="primary-button"><Plus size={16} /> New agent</button></div><div className="agents-table">{agents.map((agent) => <button key={agent.id} onClick={() => onSelect(agent.id)} className={selectedId === agent.id ? "agent-row selected" : "agent-row"}><span className={`agent-led ${statusMeta[agent.status].className}`} /><div><strong>{agent.name}</strong><small>{agent.objective}</small></div><div><span>{agent.repository}</span><small>{agent.branch}</small></div><StatusPill status={agent.status} /><div className="mini-progress"><span><i style={{ width: `${agent.progress}%` }} /></span><small>{agent.progress}%</small></div><CornerUpRight size={16} /></button>)}</div></div>;
}

function WorkflowsView({ workflows: items, onRun }: { workflows: WorkflowType[]; onRun: (id: string) => void }) {
  return <div className="view-stack"><div className="view-heading"><div><span>Reusable orchestration</span><h2>Workflow Builder</h2><p>Compose safe multi-step agent operations with approvals, retries, and quality gates.</p></div><button className="primary-button"><Plus size={16} /> New workflow</button></div><div className="workflow-grid">{items.map((workflow) => <article className="workflow-card" key={workflow.id}><div className="workflow-card-top"><div className="workflow-icon"><Workflow size={20} /></div><button><Settings size={16} /></button></div><h3>{workflow.name}</h3><p>{workflow.description}</p><div className="workflow-stats"><span>{workflow.trigger}</span><span>{workflow.runs} runs</span><span>{workflow.successRate}% success</span></div><div className="workflow-steps">{workflow.steps.map((step, index) => <div key={step.id} className={`workflow-step step-${step.state}`}><i>{index + 1}</i><span>{step.label}</span><small>{step.state}</small></div>)}</div><button className="run-workflow" onClick={() => onRun(workflow.id)}><Play size={15} /> Run workflow</button></article>)}</div></div>;
}

function ApprovalsView({ requests, onOpen }: { requests: ApprovalRequest[]; onOpen: (request: ApprovalRequest) => void }) {
  return <div className="view-stack"><div className="view-heading"><div><span>Human control plane</span><h2>Approval Center</h2><p>Make informed decisions with command, scope, reversibility, and risk shown before execution.</p></div></div><div className="approval-list">{requests.map((request) => <button key={request.id} className="approval-row" onClick={() => onOpen(request)}><div className={`risk-icon risk-${request.risk}`}><ShieldAlert size={19} /></div><div><strong>{request.title}</strong><p>{request.detail}</p><span><Terminal size={13} /> {request.command}</span></div><div><small>{request.createdAt}</small><b>{request.risk} risk</b></div><CornerUpRight size={17} /></button>)}</div></div>;
}

function ApprovalModal({ request, onApprove, onReject, onClose }: { request: ApprovalRequest; onApprove: () => void; onReject: () => void; onClose: () => void }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="approval-modal" role="dialog" aria-modal="true" aria-labelledby="approval-title"><div className="modal-header"><div className={`risk-icon risk-${request.risk}`}><ShieldAlert size={21} /></div><div><span>Agent approval request</span><h2 id="approval-title">{request.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><p className="modal-description">{request.detail}</p><div className="command-preview"><span>Exact command</span><code>{request.command}</code></div><div className="risk-grid"><div><Database size={16} /><span>Scope</span><strong>{request.scope}</strong></div><div><RotateCcw size={16} /><span>Reversible</span><strong>{request.reversible ? "Yes" : "No"}</strong></div><div><Network size={16} /><span>Network</span><strong>{request.networkAccess ? "Required" : "Blocked"}</strong></div><div><ShieldAlert size={16} /><span>Risk</span><strong>{request.risk}</strong></div></div><div className="safety-note"><ShieldAlert size={17} /><p>This approval is limited to the displayed command and development scope. Production, secrets, destructive SQL, and force pushes require a separate confirmation.</p></div><div className="modal-actions"><button onClick={onReject} className="reject-button"><X size={16} /> Decline</button><button onClick={onApprove} className="approve-button"><Check size={16} /> Approve once</button></div></section></div>;
}
