"use client";

import type { Paiement } from "../_lib/store";
import { arrondir, formatEuros } from "../_lib/argent";
import { carte, effetBouton } from "../_lib/styles";
import { IconeChevron } from "./Icones";

type Props = {
  paiements: Paiement[];
  onAnnuler: (id: number) => Promise<boolean>;
};

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Tous les paiements de la soirée (Dashboard du bar), du plus récent au plus
// ancien, avec possibilité d'annuler une erreur de saisie.
export default function ListePaiements({ paiements, onAnnuler }: Props) {
  const tries = [...paiements].sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  const total = arrondir(paiements.reduce((somme, p) => somme + p.montant, 0));

  return (
    <details className={`group ${carte}`}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-[18px] [&::-webkit-details-marker]:hidden">
        <span className="grow text-base font-semibold">Paiements</span>
        <span className="text-sm text-doux">
          {paiements.length} · {formatEuros(total)}
        </span>
        <span className="text-doux transition-transform group-open:rotate-90">
          <IconeChevron taille={18} />
        </span>
      </summary>

      {tries.length === 0 ? (
        <p className="px-[18px] pb-[18px] text-[15px] text-doux">
          Aucun paiement pour le moment.
        </p>
      ) : (
        <div className="flex flex-col px-[18px] pb-2">
          {tries.map((p) => (
            <div
              key={p.id}
              className="flex min-h-12 items-center gap-3 border-t border-ligne text-sm first:border-t-0"
            >
              <span className="w-16 shrink-0 font-semibold">
                {p.table}
              </span>
              <span className="flex min-w-0 grow flex-col">
                <span>{p.mode === "cb" ? "CB" : "Espèces"}</span>
                <span className="truncate text-[13px] text-doux">
                  {heure(p.creeLe)}
                  {p.serveur ? ` · ${p.serveur}` : ""}
                </span>
              </span>
              <span className="font-semibold">{formatEuros(p.montant)}</span>
              {p.id > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `Annuler le paiement de ${formatEuros(p.montant)} (${p.table}) ? Le montant redeviendra à régler sur la table.`
                      )
                    ) {
                      onAnnuler(p.id);
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
    </details>
  );
}
