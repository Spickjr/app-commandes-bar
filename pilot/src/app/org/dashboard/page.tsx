import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeFinanceSummary } from "@/lib/finance";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatusBadge } from "@/components/shared/status-badge";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney, formatMoneySigned, formatDate, daysUntil } from "@/lib/utils";
import { Plus, CalendarDays, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const ctx = await requireOrgContext();

  const events = await prisma.event.findMany({
    where: { organizationId: ctx.organizationId },
    include: {
      expenses: { include: { payments: true, category: true } },
      revenues: { include: { payments: true } },
    },
    orderBy: { date: "asc" },
  });

  const allExpenses = events.flatMap((e) => e.expenses);
  const allRevenues = events.flatMap((e) => e.revenues);
  const summary = computeFinanceSummary(allExpenses, allRevenues);

  const now = new Date();
  const upcoming = events.filter((e) => e.date >= now && e.status !== "ANNULE").slice(0, 5);
  const finished = events.filter((e) => e.status === "TERMINE").length;
  const preparing = events.filter((e) => ["BROUILLON", "EN_PREPARATION"].includes(e.status)).length;
  const thisYear = new Date().getFullYear();
  const eventsThisYear = events.filter((e) => e.date.getFullYear() === thisYear).length;

  const unpaidExpenses = allExpenses.filter((e) => {
    const paid = e.payments.reduce((s, p) => s + p.amount, 0);
    const due = (e.actualAmountTtc ?? e.forecastAmountTtc) - paid;
    return due > 0.01 && e.status !== "ANNULE";
  }).length;

  const pendingQuotes = allExpenses.filter((e) => e.status === "DEVIS_DEMANDE" || e.status === "DEVIS_RECU").length;

  const [overdueTasks, missingDocs] = await Promise.all([
    prisma.task.count({
      where: {
        organizationId: ctx.organizationId,
        status: { notIn: ["TERMINE"] },
        dueDate: { lt: now },
      },
    }),
    prisma.documentRequirement.count({
      where: { fulfilled: false, event: { organizationId: ctx.organizationId } },
    }),
  ]);

  const categoryTotals = new Map<string, number>();
  for (const e of allExpenses) {
    const name = e.category?.name ?? "Sans catégorie";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + (e.actualAmountTtc ?? e.forecastAmountTtc ?? 0));
  }
  const categoryData = Array.from(categoryTotals.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description={`${eventsThisYear} événement${eventsThisYear > 1 ? "s" : ""} cette année`}
        action={
          <Button asChild>
            <Link href="/org/events/new">
              <Plus className="h-4 w-4" /> Nouvel événement
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Événements" value={String(events.length)} hint={`${upcoming.length} à venir · ${finished} terminés · ${preparing} en préparation`} />
        <StatCard label="Budget prévisionnel cumulé" value={formatMoney(summary.expensesForecast)} />
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
          label="Résultat réel"
          value={formatMoneySigned(summary.resultActual)}
          tone={summary.resultActual >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <CalendarDays className="h-4 w-4" /> Prochains événements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState title="Aucun événement à venir" description="Créez votre prochain événement pour le voir apparaître ici." />
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {upcoming.map((e) => (
                  <Link key={e.id} href={`/org/events/${e.id}`} className="flex items-center justify-between py-3 text-sm hover:opacity-70">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(e.date)} · dans {daysUntil(e.date)} j
                      </p>
                    </div>
                    <EventStatusBadge status={e.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-4 w-4" /> Alertes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <AlertRow label="Paiements à effectuer" value={unpaidExpenses} href="/org/deadlines" />
            <AlertRow label="Devis en attente" value={pendingQuotes} href="/org/deadlines" />
            <AlertRow label="Tâches en retard" value={overdueTasks} href="/org/tasks" />
            <AlertRow label="Documents manquants" value={missingDocs} href="/org/deadlines" />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-foreground">Répartition des dépenses par catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryBreakdownChart data={categoryData} />
        </CardContent>
      </Card>
    </div>
  );
}

function AlertRow({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md px-2 py-1.5 -mx-2 hover:bg-accent">
      <span className={value > 0 ? "" : "text-muted-foreground"}>{label}</span>
      <span className={value > 0 ? "font-semibold tabular-nums" : "text-muted-foreground tabular-nums"}>{value}</span>
    </Link>
  );
}
