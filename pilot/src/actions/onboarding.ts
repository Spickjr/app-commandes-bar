"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_REVENUE_CATEGORIES } from "@/lib/constants";
import type { FormState } from "./auth";

const schema = z.object({
  organizationName: z.string().min(1, "Nom de structure requis"),
  organizationType: z.string().min(1, "Type requis"),
  eventsPerYear: z.coerce.number().int().min(0).optional(),
});

export async function completeOnboardingAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = schema.safeParse({
    organizationName: formData.get("organizationName"),
    organizationType: formData.get("organizationType"),
    eventsPerYear: formData.get("eventsPerYear") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const existing = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  if (existing) {
    redirect("/org/dashboard");
  }

  const org = await prisma.organization.create({
    data: {
      name: parsed.data.organizationName,
      type: parsed.data.organizationType,
      eventsPerYear: parsed.data.eventsPerYear,
      members: { create: { userId: user.id, role: "OWNER" } },
      categories: {
        create: [
          ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ scope: "EXPENSE", name, isDefault: true })),
          ...DEFAULT_REVENUE_CATEGORIES.map((name) => ({ scope: "REVENUE", name, isDefault: true })),
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: { organizationId: org.id, userId: user.id, action: "CREATE", entityType: "Organization", entityId: org.id },
  });

  redirect("/org/events/new?first=1");
}
