"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite } from "@/lib/session";
import type { SimpleFormState } from "./expenses";

// Quantité saisie en français (virgule acceptée), vide = 0.
const quantite = z.preprocess(
  (v) => (v === "" || v == null ? 0 : Number(String(v).replace(",", "."))),
  z.number({ invalid_type_error: "Quantité invalide" }).min(0, "Quantité positive")
);

const stockSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().trim().min(1, "Nom requis"),
  unit: z.string().trim().optional(),
  initialQty: quantite,
  alertQty: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(String(v).replace(",", "."))),
    z.number({ invalid_type_error: "Seuil invalide" }).min(0).optional()
  ),
  notes: z.string().trim().optional(),
});

async function eventDeLOrganisation(eventId: string, organizationId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizationId } });
  if (!event) throw new Error("Événement introuvable");
  return event;
}

export async function createStockItemAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = stockSchema.safeParse({
    eventId: formData.get("eventId"),
    name: formData.get("name"),
    unit: formData.get("unit") || undefined,
    initialQty: formData.get("initialQty"),
    alertQty: formData.get("alertQty"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await eventDeLOrganisation(parsed.data.eventId, ctx.organizationId);

  await prisma.stockItem.create({
    data: {
      eventId: parsed.data.eventId,
      organizationId: ctx.organizationId,
      name: parsed.data.name,
      unit: parsed.data.unit || null,
      initialQty: parsed.data.initialQty,
      alertQty: parsed.data.alertQty ?? null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath(`/org/events/${parsed.data.eventId}/stocks`);
  return {};
}

// Modifie la quantité de départ ou utilisée d'un article.
export async function updateStockQtyAction(itemId: string, field: "initialQty" | "usedQty", value: number) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  if (!["initialQty", "usedQty"].includes(field) || !Number.isFinite(value) || value < 0) {
    throw new Error("Quantité invalide");
  }

  const item = await prisma.stockItem.update({
    where: { id: itemId, organizationId: ctx.organizationId },
    data: { [field]: value },
  });

  revalidatePath(`/org/events/${item.eventId}/stocks`);
}

export async function deleteStockItemAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const itemId = String(formData.get("itemId"));

  const item = await prisma.stockItem.delete({
    where: { id: itemId, organizationId: ctx.organizationId },
  });

  revalidatePath(`/org/events/${item.eventId}/stocks`);
}
