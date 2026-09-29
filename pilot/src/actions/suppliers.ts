"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgContext, assertCanWrite } from "@/lib/session";
import type { SimpleFormState } from "./expenses";

const supplierSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  categoryId: z.string().optional(),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  companyNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function createSupplierAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    categoryId: formData.get("categoryId") || undefined,
    contactName: formData.get("contactName") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    companyNumber: formData.get("companyNumber") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const supplier = await prisma.supplier.create({
    data: { organizationId: ctx.organizationId, ...parsed.data, categoryId: parsed.data.categoryId || null, email: parsed.data.email || null },
  });

  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action: "CREATE", entityType: "Supplier", entityId: supplier.id },
  });

  revalidatePath("/org/suppliers");
  return {};
}

export async function deleteSupplierAction(formData: FormData) {
  const ctx = await requireOrgContext();
  assertCanWrite(ctx.role);
  const supplierId = String(formData.get("supplierId"));

  await prisma.supplier.delete({ where: { id: supplierId, organizationId: ctx.organizationId } });

  revalidatePath("/org/suppliers");
}
