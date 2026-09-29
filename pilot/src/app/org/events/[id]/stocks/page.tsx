import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EventNav } from "@/components/shared/event-nav";
import { StocksClient } from "@/components/stocks/stocks-client";

export default async function EventStocksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!event) notFound();

  const items = await prisma.stockItem.findMany({
    where: { eventId: id },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title={event.name} description="Stocks" />
      <EventNav eventId={id} />
      <StocksClient
        eventId={id}
        items={items.map(({ id, name, unit, initialQty, usedQty, alertQty, notes }) => ({
          id,
          name,
          unit,
          initialQty,
          usedQty,
          alertQty,
          notes,
        }))}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
