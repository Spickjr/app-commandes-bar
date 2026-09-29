"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Select } from "@/components/ui/select";
import { switchOrganizationAction } from "@/actions/members";

/** Passe d'une organisation à l'autre quand l'utilisateur est membre de plusieurs. */
export function OrgSwitcher({
  organizations,
  currentId,
}: {
  organizations: { id: string; name: string }[];
  currentId: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {organizations.length > 1 && (
        <form action={switchOrganizationAction}>
          <Select
            name="organizationId"
            defaultValue={currentId}
            aria-label="Organisation active"
            className="h-8 text-xs"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </form>
      )}
      <Link
        href="/onboarding?nouvelle=1"
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Nouvelle organisation
      </Link>
    </div>
  );
}
