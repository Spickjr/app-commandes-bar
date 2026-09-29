"use client";

import { useActionState, useState, useTransition } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { createStockItemAction, deleteStockItemAction, updateStockQtyAction } from "@/actions/stocks";
import type { SimpleFormState } from "@/actions/expenses";
import { cn } from "@/lib/utils";

interface StockRow {
  id: string;
  name: string;
  unit: string | null;
  initialQty: number;
  usedQty: number;
  alertQty: number | null;
  notes: string | null;
}

const nombre = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

const restantDe = (item: StockRow) => item.initialQty - item.usedQty;

const enAlerte = (item: StockRow) => {
  const restant = restantDe(item);
  return restant <= 0 || (item.alertQty !== null && restant <= item.alertQty);
};

export function StocksClient({ eventId, items, canWrite }: { eventId: string; items: StockRow[]; canWrite: boolean }) {
  const [open, setOpen] = useState(false);
  const alertes = items.filter(enAlerte).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {items.length} article{items.length > 1 ? "s" : ""}
          {alertes > 0 && (
            <span className="font-medium text-destructive">
              {" "}
              · {alertes} en alerte
            </span>
          )}
        </p>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Article
              </Button>
            </DialogTrigger>
            <DialogContent side="right">
              <AddStockForm eventId={eventId} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun article en stock"
          description="Ajoutez ce que vous prévoyez pour l'événement (boissons, gobelets, glaçons, matériel…). En fin de soirée, notez ce qu'il reste : ce qui a été passé se calcule tout seul."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead className="text-right">Départ</TableHead>
              <TableHead className="text-right">Reste (fin de soirée)</TableHead>
              <TableHead className="text-right">Passé</TableHead>
              {canWrite && <TableHead className="w-0" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <StockLine key={item.id} item={item} canWrite={canWrite} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function StockLine({ item, canWrite }: { item: StockRow; canWrite: boolean }) {
  const [pending, startTransition] = useTransition();
  const restant = restantDe(item);
  const alerte = enAlerte(item);

  // On note ce qu'il reste : le « passé » est calculé (départ − reste).
  const enregistrerReste = (reste: number) => {
    if (reste > item.initialQty) {
      toast.error("Le reste dépasse la quantité de départ : corrige d'abord le départ.");
      return;
    }
    enregistrer("usedQty", Math.round((item.initialQty - reste) * 100) / 100);
  };

  const enregistrer = (field: "initialQty" | "usedQty", value: number) => {
    startTransition(async () => {
      try {
        await updateStockQtyAction(item.id, field, value);
      } catch {
        toast.error("Quantité non enregistrée");
      }
    });
  };

  return (
    <TableRow className={cn(pending && "opacity-60")}>
      <TableCell>
        <p className="font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {[item.unit, item.alertQty !== null ? `alerte à ${nombre(item.alertQty)}` : null, item.notes]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </TableCell>
      <TableCell className="text-right">
        {canWrite ? (
          <QuantiteInput
            key={`depart-${item.initialQty}`}
            valeur={item.initialQty}
            label={`Quantité de départ : ${item.name}`}
            onValider={(v) => enregistrer("initialQty", v)}
            className="ml-auto"
          />
        ) : (
          <span className="tabular-nums">{nombre(item.initialQty)}</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {canWrite ? (
          <div className="flex items-center justify-end gap-1.5">
            <QuantiteInput
              key={`reste-${restant}`}
              valeur={restant}
              label={`Quantité restante : ${item.name}`}
              onValider={enregistrerReste}
              className={cn(alerte && "border-destructive text-destructive")}
            />
            {item.unit && <span className="w-14 truncate text-left text-xs text-muted-foreground">{item.unit}</span>}
          </div>
        ) : (
          <span className={cn("tabular-nums", alerte && "text-destructive")}>{nombre(restant)}</span>
        )}
      </TableCell>
      <TableCell className="text-right text-base font-semibold tabular-nums">
        {nombre(item.usedQty)}
        {item.unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{item.unit}</span>}
      </TableCell>
      {canWrite && (
        <TableCell>
          <form action={deleteStockItemAction}>
            <input type="hidden" name="itemId" value={item.id} />
            <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage={`Supprimer « ${item.name} » du stock ?`}>
              Suppr.
            </ConfirmSubmitButton>
          </form>
        </TableCell>
      )}
    </TableRow>
  );
}

// Champ numérique enregistré quand on quitte le champ (ou Entrée).
function QuantiteInput({
  valeur,
  label,
  onValider,
  className,
}: {
  valeur: number;
  label: string;
  onValider: (v: number) => void;
  className?: string;
}) {
  const [saisie, setSaisie] = useState(String(valeur).replace(".", ","));

  const valider = () => {
    const v = Number(saisie.replace(",", "."));
    if (!Number.isFinite(v) || v < 0) {
      setSaisie(String(valeur).replace(".", ","));
      toast.error("Quantité invalide");
      return;
    }
    if (v !== valeur) onValider(v);
  };

  return (
    <Input
      aria-label={label}
      inputMode="decimal"
      value={saisie}
      onChange={(e) => setSaisie(e.target.value)}
      onBlur={valider}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={cn("h-8 w-20 text-right tabular-nums", className)}
    />
  );
}

const initialState: SimpleFormState = {};

function AddStockForm({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createStockItemAction(prev, fd);
    if (!result.error) {
      toast.success("Article ajouté");
      onDone();
    }
    return result;
  }, initialState);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouvel article</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="eventId" value={eventId} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Article *</Label>
          <Input id="name" name="name" required autoFocus placeholder="ex : Fût de bière 30 L, gobelets…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initialQty">Quantité de départ</Label>
            <Input id="initialQty" name="initialQty" inputMode="decimal" placeholder="0" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="unit">Unité</Label>
            <Input id="unit" name="unit" placeholder="bouteilles, fûts…" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alertQty">Alerte quand il reste (facultatif)</Label>
          <Input id="alertQty" name="alertQty" inputMode="decimal" placeholder="ex : 5" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? "Ajout…" : "Ajouter"}
        </Button>
      </form>
    </>
  );
}
