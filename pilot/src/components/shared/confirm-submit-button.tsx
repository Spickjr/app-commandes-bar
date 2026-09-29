"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Bouton de suppression avec confirmation native — utilisé dans un <form action={serverAction}>.
 * Simple et fiable : pas de faux positif "bouton décoratif", la suppression est réelle
 * et systématiquement confirmée (règle §46 du cahier des charges).
 */
export function ConfirmSubmitButton({
  confirmMessage = "Confirmer la suppression ? Cette action est irréversible.",
  children,
  ...props
}: ButtonProps & { confirmMessage?: string }) {
  return (
    <Button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
