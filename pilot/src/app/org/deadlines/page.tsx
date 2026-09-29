import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney, formatDate } from "@/lib/utils";
import { Clock } from "lucide-react";

interface DeadlineItem {
  date: Date;
  label: string;
  detail: string;
  href: string;
  kind: "Paiement" | "Encaissement" | "Tâche" | "Document";
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function DeadlinesPage() {
  const ctx = await requireOrgContext();

  const [expenses, revenues, tasks] = await Promise.all([
    prisma.expense.findMany({
      where: { organizationId: ctx.organizationId, dueDate: { not: null }, status: { notIn: ["PAYE", "ANNULE"] } },
      include: { event: true, payments: true },
    }),
    prisma.revenue.findMany({
      where: { organizationId: ctx.organizationId, expectedDate: { not: null }, status: { notIn: ["ENCAISSE", "ANNULE"] } },
      include: { event: true, payments: true },
    }),
    prisma.task.findMany({
      where: { organizationId: ctx.organizationId, dueDate: { not: null }, status: { not: "TERMINE" } },
      include: { event: true },
    }),
  ]);

  const items: DeadlineItem[] = [];

  for (const e of expenses) {
    const remaining = (e.actualAmountTtc ?? e.forecastAmountTtc) - e.payments.reduce((s, p) => s + p.amount, 0);
    if (remaining <= 0.01) continue;
    items.push({
      date: e.dueDate!,
      label: e.label,
      detail: `${e.event.name} · ${formatMoney(remaining, true)} à payer`,
      href: `/org/events/${e.eventId}/expenses`,
      kind: "Paiement",
    });
  }

  for (const r of revenues) {
    const remaining = (r.actualAmount ?? r.forecastAmount) - r.payments.reduce((s, p) => s + p.amount, 0);
    if (remaining <= 0.01) continue;
    items.push({
      date: r.expectedDate!,
      label: r.label,
      detail: `${r.event.name} · ${formatMoney(remaining, true)} à encaisser`,
      href: `/org/events/${r.eventId}/revenues`,
      kind: "Encaissement",
    });
  }

  for (const t of tasks) {
    items.push({
      date: t.dueDate!,
      label: t.title,
      detail: t.event ? t.event.name : "Tâche générale",
      href: t.eventId ? `/org/events/${t.eventId}/tasks` : "/org/tasks",
      kind: "Tâche",
    });
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = startOfDay(new Date());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const groups = {
    "Aujourd'hui": items.filter((i) => startOfDay(i.date).getTime() === today.getTime()),
    "Cette semaine": items.filter((i) => startOfDay(i.date) > today && startOfDay(i.date) <= endOfWeek),
    "Ce mois": items.filter((i) => startOfDay(i.date) > endOfWeek && startOfDay(i.date) <= endOfMonth),
    "Plus tard": items.filter((i) => startOfDay(i.date) > endOfMonth),
    "En retard": items.filter((i) => startOfDay(i.date) < today),
  };

  return (
    <div>
      <PageHeader title="Échéances" description="Paiements, encaissements, tâches et documents à venir" />

      {items.length === 0 ? (
        <EmptyState icon={Clock} title="Aucune échéance" description="Rien à surveiller pour le moment." />
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(groups).map(([label, group]) =>
            group.length > 0 ? (
              <Card key={label}>
                <CardHeader>
                  <CardTitle className={label === "En retard" ? "text-destructive" : "text-foreground"}>
                    {label} ({group.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col divide-y divide-border">
                  {group.map((item, i) => (
                    <Link key={i} href={item.href} className="flex items-center justify-between py-2.5 text-sm hover:opacity-70">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                        <p className="text-xs">{item.kind}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
