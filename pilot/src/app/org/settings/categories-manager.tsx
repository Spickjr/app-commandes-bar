"use client";

import { useActionState, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/shared/confirm-submit-button";
import { createCategoryAction, deleteCategoryAction } from "@/actions/settings";
import type { SimpleFormState } from "@/actions/expenses";

interface CategoryRow {
  id: string;
  name: string;
  scope: string;
  isDefault: boolean;
}

const SCOPE_LABELS: Record<string, string> = { EXPENSE: "Dépenses", REVENUE: "Recettes", SUPPLIER: "Prestataires" };

const initialState: SimpleFormState = {};

export function CategoriesManager({ categories, canWrite }: { categories: CategoryRow[]; canWrite: boolean }) {
  const grouped = useMemo(() => {
    const g: Record<string, CategoryRow[]> = { EXPENSE: [], REVENUE: [], SUPPLIER: [] };
    for (const c of categories) g[c.scope]?.push(c);
    return g;
  }, [categories]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Object.entries(SCOPE_LABELS).map(([scope, label]) => (
        <CategoryScopeCard key={scope} scope={scope} label={label} items={grouped[scope] ?? []} canWrite={canWrite} />
      ))}
    </div>
  );
}

function CategoryScopeCard({ scope, label, items, canWrite }: { scope: string; label: string; items: CategoryRow[]; canWrite: boolean }) {
  const [name, setName] = useState("");
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await createCategoryAction(prev, fd);
    if (!result.error) {
      toast.success("Catégorie ajoutée");
      setName("");
    }
    return result;
  }, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5">
        {items.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-md px-1 py-1 text-sm">
            <span>{c.name}</span>
            {canWrite && (
              <form action={deleteCategoryAction}>
                <input type="hidden" name="categoryId" value={c.id} />
                <ConfirmSubmitButton variant="ghost" size="sm" confirmMessage={`Supprimer la catégorie "${c.name}" ?`}>
                  ×
                </ConfirmSubmitButton>
              </form>
            )}
          </div>
        ))}
        {canWrite && (
          <form action={formAction} className="mt-2 flex gap-1.5">
            <input type="hidden" name="scope" value={scope} />
            <Input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouvelle catégorie" className="h-8 text-sm" />
            <Button type="submit" size="sm" variant="outline" disabled={pending || !name.trim()}>
              +
            </Button>
          </form>
        )}
        {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      </CardContent>
    </Card>
  );
}
