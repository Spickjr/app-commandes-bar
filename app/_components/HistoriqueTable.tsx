import type { Commande } from "../_lib/store";
import { nomSurUneLigne } from "../_lib/carte";
import { totalItems } from "../_lib/calculs";
import { effetBouton } from "../_lib/styles";
import { IconeChevron } from "./Icones";

type Props = {
  table: string;
  commandes: Commande[];
  // Absent = lecture seule (profil serveur).
  onEffacer?: (id: number) => void;
};

// Historique des commandes d'une table, repliable (Dashboard et Historique).
export default function HistoriqueTable({ table, commandes, onEffacer }: Props) {
  const totalTable = commandes.reduce(
    (total, commande) => total + totalItems(commande.items),
    0
  );

  return (
    <details className="group border-t border-ligne first:border-t-0">
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-[18px] [&::-webkit-details-marker]:hidden">
        <span className="grow text-[15px] font-medium">{table}</span>
        <span className="text-sm text-doux">
          {commandes.length} commande{commandes.length > 1 ? "s" : ""} ·{" "}
          {totalTable} €
        </span>
        <span className="text-doux transition-transform group-open:rotate-90">
          <IconeChevron taille={18} />
        </span>
      </summary>

      <div className="flex flex-col gap-2 px-3 pb-3">
        {commandes.map((commande, index) => (
          <div key={commande.id} className="rounded-2xl bg-carte-2/60 p-3.5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">
                Commande {index + 1}
                <span className="font-normal text-doux">
                  {" "}
                  · {commande.serveur || "Serveur non renseigné"}
                </span>
                {commande.statut !== "terminée" && (
                  <span className="ml-2 rounded-full bg-ambre/15 px-2 py-0.5 text-xs font-semibold text-ambre">
                    En cours
                  </span>
                )}
              </span>
              <span className="text-sm font-semibold">
                {totalItems(commande.items)} €
              </span>
            </div>

            <div className="flex flex-col gap-1 text-sm">
              {commande.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <span className="break-words">
                    {item.quantite} × {nomSurUneLigne(item.nom)}
                  </span>
                  <span className="shrink-0 text-doux">
                    {item.prix * item.quantite} €
                  </span>
                </div>
              ))}
            </div>

            {onEffacer && (
              <button
                type="button"
                onClick={() => onEffacer(commande.id)}
                className={`mt-2 -mb-1 min-h-11 text-sm font-semibold text-rouge ${effetBouton}`}
              >
                Effacer
              </button>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
