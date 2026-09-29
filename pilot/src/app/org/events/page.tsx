import Link from "next/link";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EventStatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatMoney } from "@/lib/utils";
import { computeFinanceSummary } from "@/lib/finance";
import { Plus, CalendarDays } from "lucide-react";
import { CaisseBarButton } from "@/components/shared/caisse-bar-button";

export default async function EventsPage() {
  const ctx = await requireOrgContext();

  const events = await prisma.event.findMany({
    where: { organizationId: ctx.organizationId },
    include: { expenses: { include: { payments: true } }, revenues: { include: { payments: true } } },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Événements"
        description={`${events.length} événement${events.length > 1 ? "s" : ""}`}
        action={
          <Button asChild>
            <Link href="/org/events/new">
              <Plus className="h-4 w-4" /> Nouvel événement
            </Link>
          </Button>
        }
      />

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aucun événement"
          description="Créez votre premier événement pour commencer à piloter votre budget."
          action={
            <Button asChild>
              <Link href="/org/events/new">
                <Plus className="h-4 w-4" /> Créer un événement
              </Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Budget prévisionnel</TableHead>
              <TableHead className="text-right">Résultat réel</TableHead>
              <TableHead className="text-right">Soirée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => {
              const summary = computeFinanceSummary(e.expenses, e.revenues);
              return (
                <TableRow key={e.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/org/events/${e.id}`} className="font-medium hover:underline">
                      {e.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{e.type}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                  <TableCell>
                    <EventStatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMoney(summary.expensesForecast)}</TableCell>
                  <TableCell className={`text-right tabular-nums ${summary.resultActual >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatMoney(summary.resultActual)}
                  </TableCell>
                  <TableCell className="text-right">
                    <CaisseBarButton event={e} size="sm" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
