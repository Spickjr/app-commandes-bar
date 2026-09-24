import type { ItemCommande } from "../_lib/store";
import { totalItems } from "../_lib/calculs";
import { effetBouton } from "../_lib/styles";

type Props = {
  items: ItemCommande[];
  onMoins: (nom: string) => void;
  onPlus: (item: ItemCommande) => void;
  onSupprimer: (nom: string) => void;
  onEnvoyer: () => void;
};

// Commande en préparation sur la page d'une table.
export default function Panier({
  items,
  onMoins,
  onPlus,
  onSupprimer,
  onEnvoyer,
}: Props) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">Commande</h2>

      {items.map((item) => (
        <div
          key={item.nom}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-800 p-4 rounded-xl mb-3"
        >
          <p className="text-lg sm:text-xl break-words whitespace-pre-line">
            • {item.nom} x{item.quantite} — {item.prix * item.quantite} €
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onMoins(item.nom)}
              className={`bg-zinc-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
            >
              -
            </button>

            <button
              type="button"
              onClick={() => onPlus(item)}
              className={`bg-green-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
            >
              +
            </button>

            <button
              type="button"
              onClick={() => onSupprimer(item.nom)}
              className={`bg-red-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}

      <div className="mt-6 text-3xl font-bold">
        Total : {totalItems(items)} €
      </div>

      <button
        type="button"
        onClick={onEnvoyer}
        className={`mt-6 w-full sm:w-auto bg-green-500 px-6 py-4 rounded-2xl text-xl font-bold ${effetBouton}`}
      >
        Envoyer au bar
      </button>
    </div>
  );
}
