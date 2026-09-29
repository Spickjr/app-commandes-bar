"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite } from "@/lib/session";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { SimpleFormState } from "./expenses";

const taskSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  description: z.string().optional(),
  eventId: z.string().optional(),
  priority: z.enum(TASK_PRIORITIES as unknown as [string, ...string[]]).default("NORMALE"),
  dueDate: z.string().optional(),
});

export async function createTaskAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventId: formData.get("eventId") || undefined,
    priority: formData.get("priority") || "NORMALE",
    dueDate: formData.get("dueDate") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const task = await prisma.task.create({
    data: {
      organizationId: ctx.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      eventId: parsed.data.eventId || null,
      priority: parsed.data.priority,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      assigneeId: ctx.userId,
      status: "A_FAIRE",
    },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "CREATE", entityType: "Task", entityId: task.id },
  });

  revalidatePath("/org/tasks");
  revalidatePath("/org/deadlines");
  revalidatePath("/org/dashboard");
  if (parsed.data.eventId) revalidatePath(`/org/events/${parsed.data.eventId}`);
  return {};
}

export async function updateTaskStatusAction(taskId: string, status: string) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }

  const task = await prisma.task.update({
    where: { id: taskId, organizationId: ctx.organizationId },
    data: { status },
  });

  revalidatePath("/org/tasks");
  revalidatePath("/org/deadlines");
  revalidatePath("/org/dashboard");
  if (task.eventId) revalidatePath(`/org/events/${task.eventId}`);
}

export async function deleteTaskAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const taskId = String(formData.get("taskId"));

  await prisma.task.delete({ where: { id: taskId, organizationId: ctx.organizationId } });

  revalidatePath("/org/tasks");
  revalidatePath("/org/deadlines");
  revalidatePath("/org/dashboard");
}
