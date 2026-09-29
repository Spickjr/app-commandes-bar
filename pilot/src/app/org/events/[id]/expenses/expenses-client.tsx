"use client";

import { useMemo, useState } from "react";
import { useActionState, useTransition } from "react";
import { Plus, Search, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ExpenseStatusBadge } from "@/components/shared/status-badge";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { EmptyState } from "@/components/shared/empty-state";
import { createExpenseAction, updateExpenseStatusAction, recordExpensePaymentAction, deleteExpenseAction } from "@/actions/expenses";
import type { SimpleFormState } from "@/actions/expenses";
import { EXPENSE_STATUSES, EXPENSE_STATUS_LABELS } from "@/lib/constants";
import { formatMoney, formatDateShort } from "@/lib/utils";
import { Receipt } from "lucide-react";

interface ExpenseRow {
  id: string;
  label: string;
  categoryId: string | null;
  categoryName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  forecastAmountTtc: number;
  actualAmountTtc: number | null;
  status: string;
  dueDate: string | null;
  paid: number;
}

export function ExpensesClient({
  eventId,
  expenses,
  categories,
  suppliers,
  canWrite,
}: {
  eventId: string;
  expenses: ExpenseRow[];
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (search && !e.label.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && e.status !== statusFilter) return false;
      if (categoryFilter && e.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [expenses, search, statusFilter, categoryFilter]);

  function exportCsv() {
    const header = ["Intitulé", "Catégorie", "Prestataire", "Prévisionnel TTC", "Réel TTC", "Payé", "Statut", "Échéance"];
    const rows = filtered.map((e) => [
      e.label,
      e.categoryName ?? "",
      e.supplierName ?? "",
      e.forecastAmountTtc,
      e.actualAmountTtc ?? "",
      e.paid,
      EXPENSE_STATUS_LABELS[e.status as keyof typeof EXPENSE_STATUS_LABELS] ?? e.status,
      e.dueDate ? formatDateShort(e.dueDate) : "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "depenses.csv";
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
          {EXPENSE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EXPENSE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48">
          <option value="">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
                  <Plus className="h-4 w-4" /> Dépense
                </Button>
              </DialogTrigger>
              <DialogContent side="right">
                <AddExpenseForm eventId={eventId} categories={categories} suppliers={suppliers} onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Aucune dépense" description="Ajoutez une dépense pour commencer à suivre votre budget." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Intitulé</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Prestataire</TableHead>
              <TableHead className="text-right">Prévisionnel TTC</TableHead>
              <TableHead className="text-right">Réel TTC</TableHead>
              <TableHead className="text-right">Reste à payer</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Statut</TableHead>
              {canWrite && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <ExpenseRowView key={e.id} expense={e} eventId={eventId} canWrite={canWrite} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function ExpenseRowView({ expense, eventId, canWrite }: { expense: ExpenseRow; eventId: string; canWrite: boolean }) {
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const actual = expense.actualAmountTtc ?? expense.forecastAmountTtc;
  const remaining = Math.max(0, actual - expense.paid);

  return (
    <TableRow>
      <TableCell className="font-medium">{expense.label}</TableCell>
      <TableCell className="text-muted-foreground">{expense.categoryName ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">{expense.supplierName ?? "—"}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(expense.forecastAmountTtc, true)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(actual, true)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {remaining > 0 ? (
          canWrite ? (
            <button className="underline decoration-dotted underline-offset-2" onClick={() => setPayOpen(true)}>
              {formatMoney(remaining, true)}
            </button>
          ) : (
            formatMoney(remaining, true)
          )
        ) : (
          <span className="text-success">Soldé</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{expense.dueDate ? formatDateShort(expense.dueDate) : "—"}</TableCell>
      <TableCell>
        {canWrite ? (
          <Select
            value={expense.status}
            disabled={pending}
            className="h-8 w-40 text-xs"
            onChange={(e) => {
              const next = e.target.value;
              startTransition(async () => {
                try {
                  await updateExpenseStatusAction(expense.id, next, eventId);
                } catch {
                  toast.error("Erreur lors de la mise à jour");
                }
              });
            }}
          >
            {EXPENSE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {EXPENSE_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        ) : (
          <ExpenseStatusBadge status={expense.status} />
        )}
      </TableCell>
      {canWrite && (
        <TableCell>
          <div className="flex items-center gap-2">
            {payOpen && (
              <form
                action={recordExpensePaymentAction}
                className="flex items-center gap-1"
                onSubmit={() => setTimeout(() => setPayOpen(false), 0)}
              >
                <input type="hidden" name="expenseId" value={expense.id} />
                <input type="hidden" name="eventId" value={eventId} />
                <Input name="amount" type="number" step="0.01" min={0} max={remaining} placeholder="Montant" className="h-8 w-24" autoFocus />
                <Button type="submit" size="sm" variant="secondary">
                  Payer
                </Button>
              </form>
            )}
            <form action={deleteExpenseAction}>
              <input type="hidden" name="expenseId" value={expense.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage="Supprimer cette dépense ?">
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

function AddExpenseForm({
  eventId,
  categories,
  suppliers,
  onDone,
}: {
  eventId: string;
  categories: { id: string; name: string }[];
  suppliers: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createExpenseAction(prev, fd);
    if (!result.error) {
      toast.success("Dépense ajoutée");
      onDone();
    }
    return result;
  }, initialState);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvelle dépense</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="label">Intitulé *</Label>
          <Input id="label" name="label" required autoFocus placeholder="ex. Sonorisation" />
        </div>
        <div className="grid grid-cols-2 gap-3">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="supplierId">Prestataire</Label>
            <Select id="supplierId" name="supplierId" defaultValue="">
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="forecastAmountHt">Montant prévisionnel HT *</Label>
            <Input id="forecastAmountHt" name="forecastAmountHt" type="number" step="0.01" min={0} required defaultValue={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vatRate">Taux TVA %</Label>
            <Input id="vatRate" name="vatRate" type="number" step="0.1" min={0} defaultValue={20} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actualAmountHt">Montant réel HT (si connu)</Label>
          <Input id="actualAmountHt" name="actualAmountHt" type="number" step="0.01" min={0} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Statut</Label>
            <Select id="status" name="status" defaultValue="ESTIMATION">
              {EXPENSE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {EXPENSE_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dueDate">Échéance</Label>
            <Input id="dueDate" name="dueDate" type="date" />
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
