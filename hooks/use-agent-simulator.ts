"use client";

import { useCallback, useMemo, useState } from "react";
import { initialAgents, initialEvents } from "@/lib/mock-data";
import type { ActivityEvent, AgentStatus, ReasoningLevel } from "@/lib/types";

const statusOrder: AgentStatus[] = ["idle", "thinking", "complete", "requires_input", "error"];

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function useAgentSimulator() {
  const [agents, setAgents] = useState(initialAgents);
  const [events, setEvents] = useState(initialEvents);
  const [selectedId, setSelectedId] = useState(initialAgents[0].id);
  const [reasoning, setReasoningState] = useState<ReasoningLevel>("high");
  const [fastMode, setFastMode] = useState(false);

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? agents[0],
    [agents, selectedId],
  );

  const pushEvent = useCallback((message: string, severity: ActivityEvent["severity"] = "neutral", agentId: string | null = selectedId) => {
    setEvents((current) => [
      ...current.slice(-19),
      { id: crypto.randomUUID(), agentId, type: "ui.command", message, timestamp: timestamp(), severity },
    ]);
  }, [selectedId]);

  const selectAgent = useCallback((id: string) => {
    setSelectedId(id);
    setAgents((current) => current.map((agent) => agent.id === id ? { ...agent, unread: false } : agent));
  }, []);

  const setAgentStatus = useCallback((id: string, status: AgentStatus) => {
    setAgents((current) => current.map((agent) => agent.id === id ? { ...agent, status } : agent));
    pushEvent(`${id} changed to ${status.replace("_", " ")}`, status === "error" ? "danger" : "neutral", id);
  }, [pushEvent]);

  const cycleAgent = useCallback((id: string) => {
    const current = agents.find((agent) => agent.id === id);
    if (!current) return;
    const index = statusOrder.indexOf(current.status);
    const next = statusOrder[(index + 1) % statusOrder.length];
    setAgentStatus(id, next);
  }, [agents, setAgentStatus]);

  const setReasoning = useCallback((value: ReasoningLevel) => {
    setReasoningState(value);
    setAgents((current) => current.map((agent) => agent.id === selectedId ? { ...agent, reasoning: value } : agent));
    pushEvent(`Reasoning effort set to ${value}`, "neutral");
  }, [pushEvent, selectedId]);

  const executeCommand = useCallback((label: string, severity: ActivityEvent["severity"] = "neutral") => {
    pushEvent(label, severity);
  }, [pushEvent]);

  return {
    agents,
    events,
    selectedAgent,
    selectedId,
    reasoning,
    fastMode,
    setFastMode,
    selectAgent,
    cycleAgent,
    setAgentStatus,
    setReasoning,
    executeCommand,
  };
}
