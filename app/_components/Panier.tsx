import type { ItemCommande } from "../_lib/store";
import { nomSurUneLigne } from "../_lib/carte";
import { nombreArticles, totalItems } from "../_lib/calculs";
import { boutons, effetBouton } from "../_lib/styles";
import { IconeMoins, IconePlus, IconePoubelle } from "./Icones";

type Props = {
  items: ItemCommande[];
  // Boissons passées en rupture depuis leur ajout au panier.
  ruptures: string[];
  envoiEnCours: boolean;
  onMoins: (nom: string) => void;
  onPlus: (item: ItemCommande) => void;
  onEnvoyer: () => void;
};

const boutonRond = `flex size-11 items-center justify-center rounded-full ${effetBouton}`;

// Commande en préparation, collée en bas de l'écran de la table.
export default function Panier({
  items,
  ruptures,
  envoiEnCours,
  onMoins,
  onPlus,
  onEnvoyer,
}: Props) {
  const nombre = nombreArticles(items);
  const itemsEnRupture = items.filter((item) => ruptures.includes(item.nom));

  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 rounded-t-[28px] bg-carte px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex max-w-2xl flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-semibold">Commande</span>
          <span className="text-[13px] text-doux">
            {nombre === 0
              ? "Touchez une boisson pour l’ajouter"
              : `${nombre} article${nombre > 1 ? "s" : ""}`}
          </span>
        </div>

        {items.length > 0 && (
          <div className="flex max-h-[32vh] flex-col overflow-y-auto">
            {items.map((item) => (
              <div key={item.nom} className="flex min-h-12 items-center gap-2.5">
                <div className="flex min-w-0 grow flex-col">
                  <span className="truncate text-[15px] font-medium">
                    {nomSurUneLigne(item.nom)}
                  </span>
                  {ruptures.includes(item.nom) ? (
                    <span className="text-[13px] font-semibold text-rouge">
                      En rupture : à retirer
                    </span>
                  ) : (
                    <span className="text-[13px] text-doux">
                      {item.prix} € l’unité
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center rounded-full bg-carte-2">
                  <button
                    type="button"
                    aria-label={item.quantite === 1 ? "Supprimer" : "Retirer un"}
                    onClick={() => onMoins(item.nom)}
                    className={boutonRond}
                  >
                    {item.quantite === 1 ? (
                      <IconePoubelle taille={17} />
                    ) : (
                      <IconeMoins taille={18} />
                    )}
                  </button>

                  <span className="w-5 text-center text-[15px] font-semibold">
                    {item.quantite}
                  </span>

                  <button
                    type="button"
                    aria-label="Ajouter un"
                    onClick={() => onPlus(item)}
                    disabled={ruptures.includes(item.nom)}
                    className={boutonRond}
                  >
                    <IconePlus taille={18} />
                  </button>
                </div>

                <span className="w-14 shrink-0 text-right text-[15px] font-semibold">
                  {item.prix * item.quantite} €
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="my-1 h-px bg-ligne" />

        <div className="flex items-baseline justify-between">
          <span className="text-[15px] text-doux">Total</span>
          <span className="text-2xl font-semibold tracking-[-0.02em]">
            {totalItems(items)} €
          </span>
        </div>

        <button
          type="button"
          onClick={onEnvoyer}
          disabled={items.length === 0 || envoiEnCours || itemsEnRupture.length > 0}
          className={`mt-1.5 h-[54px] text-base ${boutons.principal}`}
        >
          {envoiEnCours
            ? "Envoi…"
            : itemsEnRupture.length > 0
              ? "Retire les boissons en rupture"
              : "Envoyer au bar"}
        </button>
      </div>
    </div>
  );
}
