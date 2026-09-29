"use client";

import { useMemo, useState } from "react";
import { useActionState, useTransition } from "react";
import { Plus, Search, Download, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { RevenueStatusBadge } from "@/components/shared/status-badge";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { createRevenueAction, recordRevenuePaymentAction, deleteRevenueAction } from "@/actions/revenues";
import type { SimpleFormState } from "@/actions/expenses";
import { REVENUE_STATUSES, REVENUE_STATUS_LABELS } from "@/lib/constants";
import { formatMoney, formatDateShort } from "@/lib/utils";

interface RevenueRow {
  id: string;
  label: string;
  categoryId: string | null;
  categoryName: string | null;
  forecastAmount: number;
  actualAmount: number | null;
  status: string;
  expectedDate: string | null;
  collected: number;
}

export function RevenuesClient({
  eventId,
  revenues,
  categories,
  canWrite,
}: {
  eventId: string;
  revenues: RevenueRow[];
  categories: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () =>
      revenues.filter((r) => {
        if (search && !r.label.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        return true;
      }),
    [revenues, search, statusFilter]
  );

  function exportCsv() {
    const header = ["Intitulé", "Catégorie", "Prévisionnel", "Réel", "Encaissé", "Statut", "Date prévue"];
    const rows = filtered.map((r) => [
      r.label,
      r.categoryName ?? "",
      r.forecastAmount,
      r.actualAmount ?? "",
      r.collected,
      REVENUE_STATUS_LABELS[r.status as keyof typeof REVENUE_STATUS_LABELS] ?? r.status,
      r.expectedDate ? formatDateShort(r.expectedDate) : "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recettes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-56 pl-8" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-48">
          <option value="">Tous les statuts</option>
          {REVENUE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REVENUE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {canWrite && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4" /> Recette
                </Button>
              </DialogTrigger>
              <DialogContent side="right">
                <AddRevenueForm eventId={eventId} categories={categories} onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="Aucune recette" description="Ajoutez une recette pour commencer à suivre vos encaissements." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Intitulé</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead className="text-right">Prévisionnel</TableHead>
              <TableHead className="text-right">Réel</TableHead>
              <TableHead className="text-right">Reste à encaisser</TableHead>
              <TableHead>Date prévue</TableHead>
              <TableHead>Statut</TableHead>
              {canWrite && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <RevenueRowView key={r.id} revenue={r} eventId={eventId} canWrite={canWrite} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function RevenueRowView({ revenue, eventId, canWrite }: { revenue: RevenueRow; eventId: string; canWrite: boolean }) {
  const actual = revenue.actualAmount ?? revenue.forecastAmount;
  const remaining = Math.max(0, actual - revenue.collected);
  const [collectOpen, setCollectOpen] = useState(false);

  return (
    <TableRow>
      <TableCell className="font-medium">{revenue.label}</TableCell>
      <TableCell className="text-muted-foreground">{revenue.categoryName ?? "—"}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(revenue.forecastAmount, true)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(actual, true)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {remaining > 0 ? (
          canWrite ? (
            <button className="underline decoration-dotted underline-offset-2" onClick={() => setCollectOpen(true)}>
              {formatMoney(remaining, true)}
            </button>
          ) : (
            formatMoney(remaining, true)
          )
        ) : (
          <span className="text-success">Encaissé</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{revenue.expectedDate ? formatDateShort(revenue.expectedDate) : "—"}</TableCell>
      <TableCell>
        <RevenueStatusBadge status={revenue.status} />
      </TableCell>
      {canWrite && (
        <TableCell>
          <div className="flex items-center gap-2">
            {collectOpen && (
              <form action={recordRevenuePaymentAction} className="flex items-center gap-1" onSubmit={() => setTimeout(() => setCollectOpen(false), 0)}>
                <input type="hidden" name="revenueId" value={revenue.id} />
                <input type="hidden" name="eventId" value={eventId} />
                <Input name="amount" type="number" step="0.01" min={0} max={remaining} placeholder="Montant" className="h-8 w-24" autoFocus />
                <Button type="submit" size="sm" variant="secondary">
                  Encaisser
                </Button>
              </form>
            )}
            <form action={deleteRevenueAction}>
              <input type="hidden" name="revenueId" value={revenue.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage="Supprimer cette recette ?">
                Suppr.
              </ConfirmSubmitButton>
            </form>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

const initialState: SimpleFormState = {};

function AddRevenueForm({ eventId, categories, onDone }: { eventId: string; categories: { id: string; name: string }[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createRevenueAction(prev, fd);
    if (!result.error) {
      toast.success("Recette ajoutée");
      onDone();
    }
    return result;
  }, initialState);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvelle recette</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label">Intitulé *</Label>
          <Input id="label" name="label" required autoFocus placeholder="ex. Sponsoring local" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Catégorie</Label>
          <Select id="categoryId" name="categoryId" defaultValue="">
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="forecastAmount">Montant prévisionnel *</Label>
            <Input id="forecastAmount" name="forecastAmount" type="number" step="0.01" min={0} required defaultValue={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actualAmount">Montant réel (si connu)</Label>
            <Input id="actualAmount" name="actualAmount" type="number" step="0.01" min={0} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Statut</Label>
            <Select id="status" name="status" defaultValue="PREVU">
              {REVENUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REVENUE_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expectedDate">Date prévue</Label>
            <Input id="expectedDate" name="expectedDate" type="date" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </>
  );
}
