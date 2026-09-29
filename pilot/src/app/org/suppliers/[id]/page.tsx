import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseStatusBadge } from "@/components/shared/status-badge";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      category: true,
      expenses: { include: { event: true }, orderBy: { createdAt: "desc" } },
      documents: true,
    },
  });
  if (!supplier) notFound();

  const totalSpent = supplier.expenses.reduce((s, e) => s + (e.actualAmountTtc ?? e.forecastAmountTtc ?? 0), 0);
  const eventsCount = new Set(supplier.expenses.map((e) => e.eventId)).size;

  return (
    <div>
      <PageHeader title={supplier.name} description={supplier.category?.name ?? "Prestataire"} />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Événements" value={String(eventsCount)} />
        <StatCard label="Total dépensé" value={formatMoney(totalSpent)} />
        <StatCard label="Contact" value={supplier.email || supplier.phone || "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Historique des dépenses</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-border">
          {supplier.expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune dépense enregistrée pour ce prestataire.</p>
          ) : (
            supplier.expenses.map((e) => (
              <Link
                key={e.id}
                href={`/org/events/${e.eventId}/expenses`}
                className="flex items-center justify-between py-3 text-sm hover:opacity-70"
              >
                <div>
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.event.name} · {formatDate(e.event.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">{formatMoney(e.actualAmountTtc ?? e.forecastAmountTtc, true)}</span>
                  <ExpenseStatusBadge status={e.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
