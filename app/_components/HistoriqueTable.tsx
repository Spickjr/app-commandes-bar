import type { Commande } from "../_lib/store";
import { totalItems } from "../_lib/calculs";
import { effetBouton } from "../_lib/styles";

type Props = {
  table: string;
  commandes: Commande[];
  onEffacer: (id: number) => void;
};

// Historique des commandes terminées d'une table (Dashboard).
export default function HistoriqueTable({ table, commandes, onEffacer }: Props) {
  const totalTable = commandes.reduce(
    (total, commande) => total + totalItems(commande.items),
    0
  );

  return (
    <div className="bg-zinc-900 rounded-2xl p-5">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">
        {table} — Total : {totalTable} €
      </h2>

      <div className="space-y-3">
        {commandes.map((commande, index) => (
          <div key={commande.id} className="bg-zinc-800 rounded-xl p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="font-bold mb-2 text-lg">Commande {index + 1}</p>

                <p className="text-orange-400 font-bold mb-3 text-sm sm:text-base">
                  Serveur : {commande.serveur || "Non renseigné"}
                </p>

                <div className="space-y-2">
                  {commande.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between gap-3 text-sm sm:text-lg"
                    >
                      <span className="break-words">
                        • {item.nom} x{item.quantite}
                      </span>

                      <span className="font-bold shrink-0">
                        {item.prix * item.quantite} €
                      </span>
                    </div>
                  ))}
                </div>

                <p className="text-xl font-bold mt-4">
                  Total : {totalItems(commande.items)} €
                </p>
              </div>

              <button
                type="button"
                onClick={() => onEffacer(commande.id)}
                className={`bg-red-600 px-4 py-3 rounded-xl font-bold text-sm sm:text-base ${effetBouton}`}
              >
                Effacer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
