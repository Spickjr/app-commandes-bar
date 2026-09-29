"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite } from "@/lib/session";
import { REVENUE_STATUSES } from "@/lib/constants";
import type { SimpleFormState } from "./expenses";

const revenueSchema = z.object({
  eventId: z.string().min(1),
  label: z.string().min(1, "Intitulé requis"),
  categoryId: z.string().optional(),
  forecastAmount: z.coerce.number().min(0).default(0),
  actualAmount: z.coerce.number().min(0).optional(),
  expectedDate: z.string().optional(),
  status: z.enum(REVENUE_STATUSES as unknown as [string, ...string[]]).default("PREVU"),
  notes: z.string().optional(),
});

async function assertEventInOrg(eventId: string, organizationId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId } });
  if (!event) throw new Error("Événement introuvable.");
  return event;
}

export async function createRevenueAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = revenueSchema.safeParse({
    eventId: formData.get("eventId"),
    label: formData.get("label"),
    categoryId: formData.get("categoryId") || undefined,
    forecastAmount: formData.get("forecastAmount") || 0,
    actualAmount: formData.get("actualAmount") || undefined,
    expectedDate: formData.get("expectedDate") || undefined,
    status: formData.get("status") || "PREVU",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await assertEventInOrg(parsed.data.eventId, ctx.organizationId);

  const revenue = await prisma.revenue.create({
    data: {
      eventId: parsed.data.eventId,
      organizationId: ctx.organizationId,
      label: parsed.data.label,
      categoryId: parsed.data.categoryId || null,
      forecastAmount: parsed.data.forecastAmount,
      actualAmount: parsed.data.actualAmount ?? null,
      expectedDate: parsed.data.expectedDate ? new Date(parsed.data.expectedDate) : null,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "CREATE", entityType: "Revenue", entityId: revenue.id },
  });

  revalidatePath(`/org/events/${parsed.data.eventId}`);
  revalidatePath(`/org/events/${parsed.data.eventId}/revenues`);
  revalidatePath(`/org/events/${parsed.data.eventId}/forecast`);
  revalidatePath("/org/dashboard");
  revalidatePath("/org/deadlines");
  return {};
}

export async function recordRevenuePaymentAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const revenueId = String(formData.get("revenueId"));
  const eventId = String(formData.get("eventId"));
  const amount = Number(formData.get("amount"));

  if (!amount || amount <= 0) throw new Error("Montant invalide");

  const revenue = await prisma.revenue.findFirst({ where: { id: revenueId, organizationId: ctx.organizationId } });
  if (!revenue) throw new Error("Recette introuvable");

  await prisma.payment.create({ data: { revenueId, amount } });

  revalidatePath(`/org/events/${eventId}/revenues`);
  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/dashboard");
  revalidatePath("/org/deadlines");
}

export async function deleteRevenueAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const revenueId = String(formData.get("revenueId"));
  const eventId = String(formData.get("eventId"));

  await prisma.revenue.delete({ where: { id: revenueId, organizationId: ctx.organizationId } });

  revalidatePath(`/org/events/${eventId}/revenues`);
  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/dashboard");
}
