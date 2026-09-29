"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "@/actions/onboarding";
import type { FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ORGANIZATION_TYPES } from "@/lib/constants";

const initialState: FormState = {};

export function OnboardingForm({ additional = false }: { additional?: boolean }) {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      {additional && <input type="hidden" name="additional" value="1" />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organizationName">Nom de la structure</Label>
        <Input id="organizationName" name="organizationName" required placeholder="ex. Hors Cadre Production" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="organizationType">Type de structure</Label>
        <Select id="organizationType" name="organizationType" required defaultValue="">
          <option value="" disabled>
            Sélectionner…
          </option>
          {ORGANIZATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="eventsPerYear">Nombre approximatif d&apos;événements par an</Label>
        <Input id="eventsPerYear" name="eventsPerYear" type="number" min={0} placeholder="ex. 6" />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="mt-1">
        {pending ? "Configuration…" : "Continuer"}
      </Button>
    </form>
  );
}
