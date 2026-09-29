"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrganizationAction } from "@/actions/settings";
import type { SimpleFormState } from "@/actions/expenses";

interface OrgData {
  name: string;
  address: string | null;
  legalInfo: string | null;
  currency: string;
  vatMode: string;
}

const initialState: SimpleFormState = {};

export function SettingsForms({ org, canAdmin }: { org: OrgData; canAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(async (prev: SimpleFormState, fd: FormData) => {
    const result = await updateOrganizationAction(prev, fd);
    if (!result.error) toast.success("Organisation mise à jour");
    return result;
  }, initialState);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-foreground">Organisation</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" defaultValue={org.name} disabled={!canAdmin} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" defaultValue={org.address ?? ""} disabled={!canAdmin} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="legalInfo">Informations administratives</Label>
            <Input id="legalInfo" name="legalInfo" defaultValue={org.legalInfo ?? ""} disabled={!canAdmin} placeholder="SIRET…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Devise</Label>
              <Select id="currency" name="currency" defaultValue={org.currency} disabled={!canAdmin}>
                <option value="EUR">EUR (€)</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vatMode">Mode de travail</Label>
              <Select id="vatMode" name="vatMode" defaultValue={org.vatMode} disabled={!canAdmin}>
                <option value="HT">HT</option>
                <option value="TTC">TTC</option>
              </Select>
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {canAdmin && (
            <Button type="submit" disabled={pending} className="self-start">
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
