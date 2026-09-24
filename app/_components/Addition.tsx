"use client";

import { useState } from "react";
import type { ModePaiement, Paiement } from "../_lib/store";
import { formatEuros } from "../_lib/argent";
import { boutons, carte, effetBouton } from "../_lib/styles";
import Encaissement from "./Encaissement";

type Props = {
  table: string;
  total: number;
  paye: number;
  reste: number;
  personnes: number;
  serveur: string;
  paiements: Paiement[];
  disponible: boolean;
  onEncaisser: (montant: number, mode: ModePaiement) => Promise<boolean>;
  onAnnulerPaiement: (id: number) => Promise<boolean>;
};

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Addition en cours d'une table : total, déjà payé, reste à payer, paiements.
// Masquée dès qu'elle est soldée.
export default function Addition({
  table,
  total,
  paye,
  reste,
  personnes,
  serveur,
  paiements,
  disponible,
  onEncaisser,
  onAnnulerPaiement,
}: Props) {
  const [ouvert, setOuvert] = useState(false);

  // Rien à payer (addition soldée ou rien commandé) : on n'affiche rien,
  // le montant encaissé est dans le Dashboard.
  if (reste === 0) return null;

  return (
    <div className={`flex flex-col gap-3 p-4 ${carte}`}>
      <span className="text-[17px] font-semibold">Addition</span>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-carte-2/60 py-2.5">
          <span className="text-xs text-doux">Total</span>
          <span className="text-[17px] font-semibold">{formatEuros(total)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-carte-2/60 py-2.5">
          <span className="text-xs text-doux">Payé</span>
          <span className="text-[17px] font-semibold text-sauge">{formatEuros(paye)}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-carte-2/60 py-2.5">
          <span className="text-xs text-doux">Reste</span>
          <span className={`text-[17px] font-semibold ${reste > 0 ? "text-ambre" : ""}`}>
            {formatEuros(reste)}
          </span>
        </div>
      </div>

      {paiements.length > 0 && (
        <div className="flex flex-col">
          {paiements.map((p) => (
            <div key={p.id} className="flex min-h-11 items-center gap-3 text-sm">
              <span className="w-16 shrink-0 font-semibold">
                {p.mode === "cb" ? "CB" : "Espèces"}
              </span>
              <span className="grow text-doux">
                {heure(p.creeLe)}
                {p.serveur ? ` · ${p.serveur}` : ""}
              </span>
              <span className="font-semibold">{formatEuros(p.montant)}</span>
              {p.id > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Annuler ce paiement de ${formatEuros(p.montant)} ?`)) {
                      onAnnulerPaiement(p.id);
                    }
                  }}
                  className={`min-h-11 px-1 text-[13px] font-semibold text-rouge ${effetBouton}`}
                >
                  Annuler
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disponible ? (
        <p className="text-sm text-doux">
          Encaissement pas encore activé : la table « paiements » doit être créée
          dans Supabase.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className={`h-12 text-[15px] ${boutons.principal}`}
        >
          Encaisser
        </button>
      )}

      {ouvert && (
        <Encaissement
          table={table}
          reste={reste}
          personnes={personnes}
          serveur={serveur}
          onEncaisser={onEncaisser}
          onFermer={() => setOuvert(false)}
        />
      )}
    </div>
  );
}
