"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Plus, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { TaskPriorityBadge } from "@/components/shared/status-badge";
import { createTaskAction, updateTaskStatusAction, deleteTaskAction } from "@/actions/tasks";
import type { SimpleFormState } from "@/actions/expenses";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, TASK_STATUSES, TASK_STATUS_LABELS } from "@/lib/constants";
import { formatDateShort, cn } from "@/lib/utils";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  eventId: string | null;
  eventName?: string | null;
}

export function TasksClient({
  tasks,
  events,
  fixedEventId,
  canWrite,
}: {
  tasks: TaskRow[];
  events: { id: string; name: string }[];
  fixedEventId?: string;
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const grouped = useMemo(() => {
    const g: Record<string, TaskRow[]> = { A_FAIRE: [], EN_COURS: [], BLOQUE: [], TERMINE: [] };
    for (const t of tasks) g[t.status]?.push(t);
    return g;
  }, [tasks]);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Tâche
              </Button>
            </DialogTrigger>
            <DialogContent side="right">
              <AddTaskForm events={events} fixedEventId={fixedEventId} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title="Aucune tâche" description="Ajoutez une tâche pour suivre ce qu'il reste à faire." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <div key={status}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {TASK_STATUS_LABELS[status]} ({grouped[status]?.length ?? 0})
              </p>
              <div className="flex flex-col gap-2">
                {(grouped[status] ?? []).map((t) => (
                  <TaskCard key={t.id} task={t} canWrite={canWrite} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, canWrite }: { task: TaskRow; canWrite: boolean }) {
  const [pending, startTransition] = useTransition();
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "TERMINE";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{task.title}</p>
        <TaskPriorityBadge priority={task.priority} />
      </div>
      {task.eventName && <p className="mb-1 text-xs text-muted-foreground">{task.eventName}</p>}
      {task.dueDate && (
        <p className={cn("mb-2 text-xs", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          Échéance : {formatDateShort(task.dueDate)}
        </p>
      )}
      {canWrite && (
        <div className="flex items-center gap-2">
          <Select
            className="h-7 flex-1 text-xs"
            value={task.status}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value;
              startTransition(async () => {
                try {
                  await updateTaskStatusAction(task.id, next);
                } catch {
                  toast.error("Erreur");
                }
              });
            }}
          >
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <form action={deleteTaskAction}>
            <input type="hidden" name="taskId" value={task.id} />
            <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage="Supprimer cette tâche ?">
              Suppr.
            </ConfirmSubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}

const initialState: SimpleFormState = {};

function AddTaskForm({
  events,
  fixedEventId,
  onDone,
}: {
  events: { id: string; name: string }[];
  fixedEventId?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createTaskAction(prev, fd);
    if (!result.error) {
      toast.success("Tâche ajoutée");
      onDone();
    }
    return result;
  }, initialState);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvelle tâche</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Titre *</Label>
          <Input id="title" name="title" required autoFocus />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={2} />
        </div>
        {!fixedEventId ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="eventId">Événement</Label>
            <Select id="eventId" name="eventId" defaultValue="">
              <option value="">Aucun (tâche générale)</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <input type="hidden" name="eventId" value={fixedEventId} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="priority">Priorité</Label>
            <Select id="priority" name="priority" defaultValue="NORMALE">
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Échéance</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </>
  );
}
