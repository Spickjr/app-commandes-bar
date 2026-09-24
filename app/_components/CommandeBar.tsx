import type { Commande } from "../_lib/store";
import { totalItems } from "../_lib/calculs";
import { effetBouton } from "../_lib/styles";

type Props = {
  commande: Commande;
  nouvelle: boolean;
  onPrete: () => void;
  onRecuperee: () => void;
};

// Carte d'une commande en cours sur l'écran du bar.
export default function CommandeBar({
  commande,
  nouvelle,
  onPrete,
  onRecuperee,
}: Props) {
  return (
    <div
      className={`relative rounded-2xl p-4 sm:p-6 transition-all duration-500 ${
        nouvelle
          ? "bg-orange-500 animate-pulse scale-[1.02] ring-4 ring-orange-300"
          : "bg-zinc-900"
      }`}
    >
      {nouvelle && (
        <div className="absolute top-3 right-3 bg-black text-orange-400 px-3 py-1 rounded-full text-sm font-black">
          NEW
        </div>
      )}

      <h2 className="text-2xl font-bold mb-1">{commande.table}</h2>

      <p className="text-white text-base sm:text-lg font-bold mb-4">
        Serveur : {commande.serveur || "Non renseigné"}
      </p>

      <div className="mb-4 space-y-2">
        {commande.items.map((item, index) => (
          <div
            key={index}
            className="flex justify-between gap-3 bg-black/20 rounded-xl p-3 text-base sm:text-xl"
          >
            <span className="break-words">
              {item.nom} x{item.quantite}
            </span>

            <span className="font-bold shrink-0">
              {item.prix * item.quantite} €
            </span>
          </div>
        ))}
      </div>

      <p className="text-2xl sm:text-3xl font-bold mb-5">
        Total : {totalItems(commande.items)} €
      </p>

      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
        {commande.statut === "envoyée" ? (
          <button
            type="button"
            onClick={onPrete}
            className={`bg-blue-500 px-4 py-3 rounded-xl font-bold text-lg ${effetBouton}`}
          >
            Marquer prête
          </button>
        ) : (
          <div className="bg-green-600 px-4 py-3 rounded-xl font-bold text-lg text-center">
            Prête ✅
          </div>
        )}

        <button
          type="button"
          onClick={onRecuperee}
          className={`bg-red-600 px-4 py-3 rounded-xl font-bold text-lg ${effetBouton}`}
        >
          Commande récupérée
        </button>
      </div>
    </div>
  );
}
