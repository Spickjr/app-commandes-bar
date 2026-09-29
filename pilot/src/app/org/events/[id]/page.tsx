import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeFinanceSummary, computeExpenseVarianceByCategory, computeRevenueByCategory } from "@/lib/finance";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EventNav } from "@/components/shared/event-nav";
import { EventStatusSelect } from "@/components/shared/event-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { formatMoney, formatMoneySigned, formatDate, daysUntil } from "@/lib/utils";
import { ExpenseStatusBadge } from "@/components/shared/status-badge";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: {
      expenses: { include: { payments: true, category: true, supplier: true } },
      revenues: { include: { payments: true, category: true } },
      tasks: true,
      documents: true,
    },
  });
  if (!event) notFound();

  const summary = computeFinanceSummary(event.expenses, event.revenues);
  const expenseVariance = computeExpenseVarianceByCategory(
    event.expenses.map((e) => ({ ...e, categoryName: e.category?.name ?? "Sans catégorie" }))
  );
  const revenueByCategory = computeRevenueByCategory(
    event.revenues.map((r) => ({ ...r, categoryName: r.category?.name ?? "Sans catégorie" }))
  );

  const pendingQuotes = event.expenses.filter((e) => e.status === "DEVIS_DEMANDE" || e.status === "DEVIS_RECU");
  const invoicesToPay = event.expenses.filter((e) => {
    const paid = e.payments.reduce((s, p) => s + p.amount, 0);
    const due = (e.actualAmountTtc ?? e.forecastAmountTtc) - paid;
    return due > 0.01 && e.status !== "ANNULE";
  });
  const remainingTasks = event.tasks.filter((t) => t.status !== "TERMINE");
  const missingDocs = await prisma.documentRequirement.count({ where: { eventId: event.id, fulfilled: false } });
  const suppliersCount = new Set(event.expenses.filter((e) => e.supplierId).map((e) => e.supplierId)).size;
  const days = daysUntil(event.date);

  const categoryData = expenseVariance.map((c) => ({ name: c.categoryName, value: c.actual }));

  return (
    <div>
      <PageHeader
        title={event.name}
        description={`${event.type} · ${formatDate(event.date)}${event.venueName ? " · " + event.venueName : ""}`}
        action={<EventStatusSelect eventId={event.id} status={event.status} />}
      />
      <EventNav eventId={event.id} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Jours restants" value={days >= 0 ? `${days} j` : "Passé"} />
        <StatCard label="Budget prévu" value={formatMoney(summary.expensesForecast)} />
        <StatCard label="Dépenses payées" value={formatMoney(summary.expensesPaid)} hint={`Reste à payer : ${formatMoney(summary.expensesRemaining)}`} />
        <StatCard
          label="Résultat prévisionnel"
          value={formatMoneySigned(summary.resultForecast)}
          tone={summary.resultForecast >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Recettes prévues" value={formatMoney(summary.revenuesForecast)} />
        <StatCard label="Recettes encaissées" value={formatMoney(summary.revenuesCollected)} hint={`Reste à encaisser : ${formatMoney(summary.revenuesRemaining)}`} />
        <StatCard label="Dépenses engagées" value={formatMoney(summary.expensesEngaged)} />
        <StatCard
          label="Résultat actuel"
          value={formatMoneySigned(summary.resultActual)}
          tone={summary.resultActual >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={categoryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Gestion</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row label="Prestataires" value={suppliersCount} href={`${event.id}/expenses`} />
            <Row label="Devis en attente" value={pendingQuotes.length} href={`${event.id}/expenses`} />
            <Row label="Factures à payer" value={invoicesToPay.length} href={`${event.id}/expenses`} />
            <Row label="Documents manquants" value={missingDocs} href={`${event.id}/expenses`} />
            <Row label="Tâches restantes" value={remainingTasks.length} href={`${event.id}/tasks`} />
          </CardContent>
        </Card>
      </div>

      {(pendingQuotes.length > 0 || invoicesToPay.length > 0) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-foreground">À traiter en priorité</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {[...invoicesToPay, ...pendingQuotes].slice(0, 6).map((e) => (
              <Link key={e.id} href={`/org/events/${event.id}/expenses`} className="flex items-center justify-between py-2.5 text-sm hover:opacity-70">
                <span>{e.label}</span>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums text-muted-foreground">{formatMoney(e.actualAmountTtc ?? e.forecastAmountTtc)}</span>
                  <ExpenseStatusBadge status={e.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {revenueByCategory.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-foreground">Recettes par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryBreakdownChart data={revenueByCategory.map((r) => ({ name: r.categoryName, value: r.actual }))} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={`/org/events/${href}`} className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 hover:bg-accent">
      <span className={value > 0 ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </Link>
  );
}
