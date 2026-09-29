"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanAdmin, assertCanWrite } from "@/lib/session";
import type { SimpleFormState } from "./expenses";

const orgSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  address: z.string().optional(),
  legalInfo: z.string().optional(),
  currency: z.string().min(1),
  vatMode: z.enum(["HT", "TTC"]),
});

export async function updateOrganizationAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanAdmin(ctx.role);

  const parsed = orgSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    legalInfo: formData.get("legalInfo") || undefined,
    currency: formData.get("currency") || "EUR",
    vatMode: formData.get("vatMode") || "HT",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await prisma.organization.update({ where: { id: ctx.organizationId }, data: parsed.data });
  revalidatePath("/org/settings");
  return {};
}

export async function createCategoryAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const name = String(formData.get("name") ?? "").trim();
  const scope = String(formData.get("scope") ?? "");
  if (!name || !["EXPENSE", "REVENUE", "SUPPLIER"].includes(scope)) {
    return { error: "Données invalides" };
  }

  const existing = await prisma.category.findUnique({
    where: { organizationId_scope_name: { organizationId: ctx.organizationId, scope, name } },
  });
  if (existing) return { error: "Cette catégorie existe déjà." };

  await prisma.category.create({ data: { organizationId: ctx.organizationId, scope, name } });
  revalidatePath("/org/settings");
  return {};
}

export async function deleteCategoryAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const categoryId = String(formData.get("categoryId"));

  await prisma.category.delete({ where: { id: categoryId, organizationId: ctx.organizationId } });
  revalidatePath("/org/settings");
}
