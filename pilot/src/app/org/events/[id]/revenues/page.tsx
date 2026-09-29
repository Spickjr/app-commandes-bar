import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EventNav } from "@/components/shared/event-nav";
import { RevenuesClient } from "./revenues-client";

export default async function EventRevenuesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!event) notFound();

  const [revenues, categories] = await Promise.all([
    prisma.revenue.findMany({
      where: { eventId: id },
      include: { category: true, payments: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ where: { organizationId: ctx.organizationId, scope: "REVENUE" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title={event.name} description="Recettes" />
      <EventNav eventId={id} />
      <RevenuesClient
        eventId={id}
        revenues={revenues.map((r) => ({
          ...r,
          expectedDate: r.expectedDate?.toISOString() ?? null,
          categoryName: r.category?.name ?? null,
          collected: r.payments.reduce((s, p) => s + p.amount, 0),
        }))}
        categories={categories}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
