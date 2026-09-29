"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite, assertCanAdmin } from "@/lib/session";
import { EVENT_STATUSES, EVENT_TYPES } from "@/lib/constants";

const eventSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(EVENT_TYPES as unknown as [string, ...string[]]),
  date: z.string().min(1, "Date requise"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  venueName: z.string().optional(),
  address: z.string().optional(),
  estimatedCapacity: z.coerce.number().int().min(0).optional(),
  description: z.string().optional(),
  initialBudget: z.coerce.number().min(0).optional(),
});

export interface EventFormState {
  error?: string;
  eventId?: string;
}

export async function createEventAction(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = eventSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
    venueName: formData.get("venueName") || undefined,
    address: formData.get("address") || undefined,
    estimatedCapacity: formData.get("estimatedCapacity") || undefined,
    description: formData.get("description") || undefined,
    initialBudget: formData.get("initialBudget") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const event = await prisma.event.create({
    data: {
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      type: parsed.data.type,
      date: new Date(parsed.data.date),
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      venueName: parsed.data.venueName,
      address: parsed.data.address,
      estimatedCapacity: parsed.data.estimatedCapacity,
      description: parsed.data.description,
      initialBudget: parsed.data.initialBudget,
      ownerUserId: ctx.userId,
      status: "BROUILLON",
    },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "CREATE", entityType: "Event", entityId: event.id },
  });

  revalidatePath("/org/events");
  revalidatePath("/org/dashboard");
  redirect(`/org/events/${event.id}`);
}

export async function updateEventStatusAction(eventId: string, status: string) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
    throw new Error("Statut invalide");
  }

  await prisma.event.update({
    where: { id: eventId, organizationId: ctx.organizationId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "UPDATE", entityType: "Event", entityId: eventId, metadata: JSON.stringify({ status }) },
  });

  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/events");
  revalidatePath("/org/dashboard");
}

export async function deleteEventAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanAdmin(ctx.role);
  const eventId = String(formData.get("eventId"));

  await prisma.event.delete({ where: { id: eventId, organizationId: ctx.organizationId } });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "DELETE", entityType: "Event", entityId: eventId },
  });

  revalidatePath("/org/events");
  revalidatePath("/org/dashboard");
  redirect("/org/events");
}
