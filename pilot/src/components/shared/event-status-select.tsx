"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/select";
import { updateEventStatusAction } from "@/actions/events";
import { EVENT_STATUSES, EVENT_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";

export function EventStatusSelect({ eventId, status }: { eventId: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          try {
            await updateEventStatusAction(eventId, next);
            toast.success("Statut mis à jour");
          } catch {
            toast.error("Impossible de mettre à jour le statut");
          }
        });
      }}
      className="w-44"
    >
      {EVENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {EVENT_STATUS_LABELS[s]}
        </option>
      ))}
    </Select>
  );
}
