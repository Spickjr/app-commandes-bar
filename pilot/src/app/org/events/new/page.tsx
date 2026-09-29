"use client";

import { useActionState } from "react";
import { createEventAction, type EventFormState } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { EVENT_TYPES } from "@/lib/constants";

const initialState: EventFormState = {};

export default function NewEventPage() {
  const [state, formAction, pending] = useActionState(createEventAction, initialState);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Créer un événement" description="Les champs marqués * sont requis." />

      <form action={formAction} className="flex flex-col gap-5 rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" name="name" required placeholder="ex. OFCOURSE! 6" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="type">Type *</Label>
            <Select id="type" name="type" required defaultValue="">
              <option value="" disabled>
                Sélectionner…
              </option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" name="date" type="date" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="startTime">Heure de début</Label>
            <Input id="startTime" name="startTime" type="time" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="endTime">Heure de fin</Label>
            <Input id="endTime" name="endTime" type="time" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venueName">Lieu</Label>
          <Input id="venueName" name="venueName" placeholder="Nom du lieu" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" name="address" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estimatedCapacity">Capacité estimée</Label>
            <Input id="estimatedCapacity" name="estimatedCapacity" type="number" min={0} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initialBudget">Budget initial (€)</Label>
            <Input id="initialBudget" name="initialBudget" type="number" min={0} step="0.01" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" rows={3} />
        </div>

        {state.error && <p className="text-sm text-destructive">{state.error}</p>}

        <Button type="submit" disabled={pending} className="self-start">
          {pending ? "Création…" : "Créer l'événement"}
        </Button>
      </form>
    </div>
  );
}
