"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { createSupplierAction } from "@/actions/suppliers";
import type { SimpleFormState } from "@/actions/expenses";
import { formatMoney } from "@/lib/utils";

interface SupplierRow {
  id: string;
  name: string;
  categoryName: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  eventsCount: number;
  totalSpent: number;
  lastEvent: string | null;
}

export function SuppliersClient({
  suppliers,
  categories,
  canWrite,
}: {
  suppliers: SupplierRow[];
  categories: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(
    () => suppliers.filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase())),
    [suppliers, search]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un prestataire…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 pl-8" />
        </div>
        {canWrite && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="ml-auto">
                <Plus className="h-4 w-4" /> Prestataire
              </Button>
            </DialogTrigger>
            <DialogContent side="right">
              <AddSupplierForm categories={categories} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Aucun prestataire" description="Ajoutez vos prestataires pour suivre votre historique de collaboration." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Événements</TableHead>
              <TableHead className="text-right">Dépensé</TableHead>
              <TableHead>Dernière collaboration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <Link href={`/org/suppliers/${s.id}`} className="hover:underline">
                    {s.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.categoryName ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{s.email || s.phone || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">{s.eventsCount}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(s.totalSpent)}</TableCell>
                <TableCell className="text-muted-foreground">{s.lastEvent ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

const initialState: SimpleFormState = {};

function AddSupplierForm({ categories, onDone }: { categories: { id: string; name: string }[]; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createSupplierAction(prev, fd);
    if (!result.error) {
      toast.success("Prestataire ajouté");
      onDone();
    }
    return result;
  }, initialState);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Nouveau prestataire</DialogTitle>
      </DialogHeader>
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" name="name" required autoFocus />
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
            <Label htmlFor="contactName">Contact</Label>
            <Input id="contactName" name="contactName" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" name="phone" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="companyNumber">N° entreprise</Label>
          <Input id="companyNumber" name="companyNumber" />
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
