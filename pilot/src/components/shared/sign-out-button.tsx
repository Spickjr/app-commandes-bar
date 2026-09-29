"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button variant="ghost" size="icon" type="submit" aria-label="Déconnexion">
        <LogOut className="h-4 w-4" />
      </Button>
    </form>
  );
}
