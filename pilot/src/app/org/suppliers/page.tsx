import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { SuppliersClient } from "./suppliers-client";

export default async function SuppliersPage() {
  const ctx = await requireOrgContext();

  const [suppliers, categories] = await Promise.all([
    prisma.supplier.findMany({
      where: { organizationId: ctx.organizationId },
      include: { category: true, expenses: { include: { event: { select: { name: true, date: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { organizationId: ctx.organizationId, scope: "SUPPLIER" }, orderBy: { name: "asc" } }),
  ]);

  const rows = suppliers.map((s) => {
    const totalSpent = s.expenses.reduce((sum, e) => sum + (e.actualAmountTtc ?? e.forecastAmountTtc ?? 0), 0);
    const eventNames = Array.from(new Set(s.expenses.map((e) => e.event.name)));
    const lastEvent = s.expenses
      .slice()
      .sort((a, b) => b.event.date.getTime() - a.event.date.getTime())[0]?.event.name;
    return {
      id: s.id,
      name: s.name,
      categoryName: s.category?.name ?? null,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      eventsCount: eventNames.length,
      totalSpent,
      lastEvent: lastEvent ?? null,
    };
  });

  return (
    <div>
      <PageHeader title="Prestataires" description={`${rows.length} prestataire${rows.length > 1 ? "s" : ""}`} />
      <SuppliersClient
        suppliers={rows}
        categories={categories}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
