import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { computeExpenseVarianceByCategory } from "@/lib/finance";
import { PageHeader } from "@/components/shared/page-header";
import { EventNav } from "@/components/shared/event-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ForecastActualChart } from "@/components/charts/forecast-actual-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMoney, formatMoneySigned, formatPercent, cn } from "@/lib/utils";

export default async function EventForecastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!event) notFound();

  const expenses = await prisma.expense.findMany({
    where: { eventId: id },
    include: { category: true },
  });

  const variance = computeExpenseVarianceByCategory(
    expenses.map((e) => ({ ...e, categoryName: e.category?.name ?? "Sans catégorie" }))
  );

  const totalForecast = variance.reduce((s, v) => s + v.forecast, 0);
  const totalActual = variance.reduce((s, v) => s + v.actual, 0);
  const overBudget = variance.filter((v) => v.varianceAmount > 0);
  const underBudget = variance.filter((v) => v.varianceAmount < 0);

  return (
    <div>
      <PageHeader title={event.name} description="Prévisionnel vs Réel" />
      <EventNav eventId={id} />

      {variance.length === 0 ? (
        <EmptyState title="Pas encore de dépenses" description="Ajoutez des dépenses pour voir apparaître la comparaison prévisionnel / réel." />
      ) : (
        <>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-foreground">Prévisionnel vs Réel par poste</CardTitle>
            </CardHeader>
            <CardContent>
              <ForecastActualChart data={variance.map((v) => ({ name: v.categoryName, forecast: v.forecast, actual: v.actual }))} />
            </CardContent>
          </Card>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <SummaryTile label="Total prévisionnel" value={formatMoney(totalForecast)} />
            <SummaryTile label="Total réel" value={formatMoney(totalActual)} />
            <SummaryTile
              label="Écart global"
              value={formatMoneySigned(totalActual - totalForecast)}
              tone={totalActual - totalForecast > 0 ? "negative" : "positive"}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Détail par poste</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Poste</TableHead>
                    <TableHead className="text-right">Prévisionnel</TableHead>
                    <TableHead className="text-right">Réel</TableHead>
                    <TableHead className="text-right">Écart €</TableHead>
                    <TableHead className="text-right pr-5">Écart %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variance.map((v) => (
                    <TableRow key={v.categoryId ?? "none"}>
                      <TableCell className="pl-5 font-medium">{v.categoryName}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(v.forecast, true)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(v.actual, true)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums font-medium",
                          v.varianceAmount > 0 ? "text-destructive" : v.varianceAmount < 0 ? "text-success" : ""
                        )}
                      >
                        {formatMoneySigned(v.varianceAmount)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right tabular-nums pr-5",
                          v.varianceAmount > 0 ? "text-destructive" : v.varianceAmount < 0 ? "text-success" : ""
                        )}
                      >
                        {formatPercent(v.variancePct)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {(overBudget.length > 0 || underBudget.length > 0) && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Dépassements</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  {overBudget.length === 0 && <p className="text-muted-foreground">Aucun dépassement.</p>}
                  {overBudget.map((v) => (
                    <div key={v.categoryId ?? "none"} className="flex justify-between">
                      <span>{v.categoryName}</span>
                      <span className="tabular-nums text-destructive">{formatMoneySigned(v.varianceAmount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Économies</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  {underBudget.length === 0 && <p className="text-muted-foreground">Aucune économie.</p>}
                  {underBudget.map((v) => (
                    <div key={v.categoryId ?? "none"} className="flex justify-between">
                      <span>{v.categoryName}</span>
                      <span className="tabular-nums text-success">{formatMoneySigned(v.varianceAmount)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "positive" && "text-success", tone === "negative" && "text-destructive")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
