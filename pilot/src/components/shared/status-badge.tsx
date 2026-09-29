import { Badge } from "@/components/ui/badge";
import {
  EVENT_STATUS_LABELS,
  EXPENSE_STATUS_LABELS,
  REVENUE_STATUS_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  type EventStatus,
  type ExpenseStatus,
  type RevenueStatus,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/constants";

const EVENT_TONE: Record<EventStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "muted"> = {
  BROUILLON: "muted",
  EN_PREPARATION: "warning",
  CONFIRME: "secondary",
  EN_COURS: "default",
  TERMINE: "success",
  ANNULE: "destructive",
};

const EXPENSE_TONE: Record<ExpenseStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "muted"> = {
  ESTIMATION: "muted",
  DEVIS_DEMANDE: "warning",
  DEVIS_RECU: "warning",
  VALIDE: "secondary",
  ACOMPTE_PAYE: "secondary",
  PARTIELLEMENT_PAYE: "warning",
  PAYE: "success",
  ANNULE: "destructive",
};

const REVENUE_TONE: Record<RevenueStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "muted"> = {
  PREVU: "muted",
  CONFIRME: "secondary",
  PARTIELLEMENT_ENCAISSE: "warning",
  ENCAISSE: "success",
  ANNULE: "destructive",
};

const TASK_TONE: Record<TaskStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "muted"> = {
  A_FAIRE: "muted",
  EN_COURS: "secondary",
  TERMINE: "success",
  BLOQUE: "destructive",
};

const PRIORITY_TONE: Record<TaskPriority, "default" | "secondary" | "success" | "warning" | "destructive" | "muted"> = {
  FAIBLE: "muted",
  NORMALE: "secondary",
  HAUTE: "warning",
  URGENTE: "destructive",
};

export function EventStatusBadge({ status }: { status: string }) {
  const s = status as EventStatus;
  return <Badge variant={EVENT_TONE[s] ?? "muted"}>{EVENT_STATUS_LABELS[s] ?? status}</Badge>;
}

export function ExpenseStatusBadge({ status }: { status: string }) {
  const s = status as ExpenseStatus;
  return <Badge variant={EXPENSE_TONE[s] ?? "muted"}>{EXPENSE_STATUS_LABELS[s] ?? status}</Badge>;
}

export function RevenueStatusBadge({ status }: { status: string }) {
  const s = status as RevenueStatus;
  return <Badge variant={REVENUE_TONE[s] ?? "muted"}>{REVENUE_STATUS_LABELS[s] ?? status}</Badge>;
}

export function TaskStatusBadge({ status }: { status: string }) {
  const s = status as TaskStatus;
  return <Badge variant={TASK_TONE[s] ?? "muted"}>{TASK_STATUS_LABELS[s] ?? status}</Badge>;
}

export function TaskPriorityBadge({ priority }: { priority: string }) {
  const p = priority as TaskPriority;
  return <Badge variant={PRIORITY_TONE[p] ?? "muted"}>{TASK_PRIORITY_LABELS[p] ?? priority}</Badge>;
}
