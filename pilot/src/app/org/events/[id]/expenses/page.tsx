import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EventNav } from "@/components/shared/event-nav";
import { ExpensesClient } from "./expenses-client";

export default async function EventExpensesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!event) notFound();

  const [expenses, categories, suppliers] = await Promise.all([
    prisma.expense.findMany({
      where: { eventId: id },
      include: { category: true, supplier: true, payments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { organizationId: ctx.organizationId, scope: "EXPENSE" }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title={event.name} description="Dépenses" />
      <EventNav eventId={id} />
      <ExpensesClient
        eventId={id}
        expenses={expenses.map((e) => ({
          ...e,
          dueDate: e.dueDate?.toISOString() ?? null,
          categoryName: e.category?.name ?? null,
          supplierName: e.supplier?.name ?? null,
          paid: e.payments.reduce((s, p) => s + p.amount, 0),
        }))}
        categories={categories}
        suppliers={suppliers}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
