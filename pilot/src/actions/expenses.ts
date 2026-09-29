"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite } from "@/lib/session";
import { EXPENSE_STATUSES } from "@/lib/constants";
import { htToTtc } from "@/lib/finance";

const expenseSchema = z.object({
  eventId: z.string().min(1),
  label: z.string().min(1, "Intitulé requis"),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  forecastAmountHt: z.coerce.number().min(0).default(0),
  vatRate: z.coerce.number().min(0).max(100).default(20),
  actualAmountHt: z.coerce.number().min(0).optional(),
  dueDate: z.string().optional(),
  status: z.enum(EXPENSE_STATUSES as unknown as [string, ...string[]]).default("ESTIMATION"),
  notes: z.string().optional(),
});

export interface SimpleFormState {
  error?: string;
}

async function assertEventInOrg(eventId: string, organizationId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId } });
  if (!event) throw new Error("Événement introuvable.");
  return event;
}

export async function createExpenseAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = expenseSchema.safeParse({
    eventId: formData.get("eventId"),
    label: formData.get("label"),
    categoryId: formData.get("categoryId") || undefined,
    supplierId: formData.get("supplierId") || undefined,
    forecastAmountHt: formData.get("forecastAmountHt") || 0,
    vatRate: formData.get("vatRate") || 20,
    actualAmountHt: formData.get("actualAmountHt") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    status: formData.get("status") || "ESTIMATION",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await assertEventInOrg(parsed.data.eventId, ctx.organizationId);

  const forecastTtc = htToTtc(parsed.data.forecastAmountHt, parsed.data.vatRate);
  const actualTtc = parsed.data.actualAmountHt != null ? htToTtc(parsed.data.actualAmountHt, parsed.data.vatRate) : null;

  const expense = await prisma.expense.create({
    data: {
      eventId: parsed.data.eventId,
      organizationId: ctx.organizationId,
      label: parsed.data.label,
      categoryId: parsed.data.categoryId || null,
      supplierId: parsed.data.supplierId || null,
      forecastAmountHt: parsed.data.forecastAmountHt,
      forecastAmountTtc: forecastTtc,
      actualAmountHt: parsed.data.actualAmountHt ?? null,
      actualAmountTtc: actualTtc,
      vatRate: parsed.data.vatRate,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "CREATE", entityType: "Expense", entityId: expense.id },
  });

  revalidatePath(`/org/events/${parsed.data.eventId}`);
  revalidatePath(`/org/events/${parsed.data.eventId}/expenses`);
  revalidatePath(`/org/events/${parsed.data.eventId}/forecast`);
  revalidatePath("/org/dashboard");
  revalidatePath("/org/deadlines");
  return {};
}

export async function updateExpenseStatusAction(expenseId: string, status: string, eventId: string) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  await prisma.expense.update({
    where: { id: expenseId, organizationId: ctx.organizationId },
    data: { status },
  });

  revalidatePath(`/org/events/${eventId}/expenses`);
  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/dashboard");
}

export async function recordExpensePaymentAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const expenseId = String(formData.get("expenseId"));
  const eventId = String(formData.get("eventId"));
  const amount = Number(formData.get("amount"));

  if (!amount || amount <= 0) throw new Error("Montant invalide");

  const expense = await prisma.expense.findFirst({ where: { id: expenseId, organizationId: ctx.organizationId } });
  if (!expense) throw new Error("Dépense introuvable");

  await prisma.payment.create({ data: { expenseId, amount } });

  revalidatePath(`/org/events/${eventId}/expenses`);
  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/dashboard");
  revalidatePath("/org/deadlines");
}

export async function deleteExpenseAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const expenseId = String(formData.get("expenseId"));
  const eventId = String(formData.get("eventId"));

  await prisma.expense.delete({ where: { id: expenseId, organizationId: ctx.organizationId } });

  revalidatePath(`/org/events/${eventId}/expenses`);
  revalidatePath(`/org/events/${eventId}`);
  revalidatePath("/org/dashboard");
}
