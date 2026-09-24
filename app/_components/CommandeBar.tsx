import type { Commande } from "../_lib/store";
import { nomSurUneLigne } from "../_lib/carte";
import { ALERTE_ATTENTE_MINUTES } from "../_lib/config";
import { totalItems } from "../_lib/calculs";
import { boutons } from "../_lib/styles";
import { attenteMs, estEnRetard, formatChrono, useMaintenant } from "../_lib/temps";

type Props = {
  commande: Commande;
  nouvelle: boolean;
  onPrete: () => void;
  onRecuperee: () => void;
};

const pastille = "rounded-full px-2.5 py-1 text-xs font-semibold";

// Carte d'une commande en cours sur l'écran du bar.
export default function CommandeBar({
  commande,
  nouvelle,
  onPrete,
  onRecuperee,
}: Props) {
  const prete = commande.statut === "prête";
  const maintenant = useMaintenant();
  const enRetard = estEnRetard(commande, maintenant);

  return (
    <div
      className={`flex flex-col gap-3 rounded-[20px] border p-4 transition-colors duration-500 ${
        prete ? "bg-sauge-fond" : "bg-carte"
      } ${
        enRetard
          ? "border-rouge"
          : nouvelle
            ? "border-ambre-vif"
            : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-semibold tracking-[-0.02em]">
            {commande.table}
          </span>
          <span className="text-[13px] text-doux">
            {commande.serveur || "Serveur non renseigné"}
          </span>
        </div>

        {!prete && maintenant > 0 && (
          <span
            className={`ml-auto font-semibold tabular-nums ${
              enRetard ? "text-rouge" : "text-doux"
            } text-sm`}
            aria-label="Temps d’attente"
          >
            {formatChrono(attenteMs(commande, maintenant))}
          </span>
        )}

        {nouvelle ? (
          <span className={`${pastille} bg-ambre/15 text-ambre`}>Nouvelle</span>
        ) : prete ? (
          <span className={`${pastille} bg-sauge/15 text-sauge`}>Prête</span>
        ) : (
          <span className={`${pastille} bg-bouton text-clair`}>Envoyée</span>
        )}
      </div>

      {enRetard && (
        <p className="-mt-1 text-[13px] font-semibold text-rouge">
          En attente depuis plus de {ALERTE_ATTENTE_MINUTES} minutes
        </p>
      )}

      <div className="flex flex-col gap-1.5 text-[15px]">
        {commande.items.map((item, index) => (
          <div key={index} className="flex justify-between gap-3">
            <span className="break-words">
              {item.quantite} × {nomSurUneLigne(item.nom)}
            </span>
            <span className="shrink-0 text-doux">
              {item.prix * item.quantite} €
            </span>
          </div>
        ))}
      </div>

      <div className="h-px bg-ligne" />

      <div className="flex items-baseline justify-between">
        <span className="text-sm text-doux">Total</span>
        <span className="text-lg font-semibold">
          {totalItems(commande.items)} €
        </span>
      </div>

      {prete ? (
        <button
          type="button"
          onClick={onRecuperee}
          className={`h-12 text-[15px] ${boutons.principal}`}
        >
          Commande récupérée
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onPrete}
            className={`h-12 text-[15px] ${boutons.principal}`}
          >
            Marquer prête
          </button>

          <button
            type="button"
            onClick={onRecuperee}
            className={`h-12 text-[15px] ${boutons.secondaire}`}
          >
            Récupérée
          </button>
        </div>
      )}
    </div>
  );
}
