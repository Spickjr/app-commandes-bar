import Link from "next/link";
import type { InfosTable } from "../_lib/store";
import type { EtatTable } from "../_lib/tables";
import { couleurs, effetBouton } from "../_lib/styles";

const COULEUR_ETAT: Record<EtatTable, string> = {
  libre: couleurs.gris,
  occupee: couleurs.bleu,
  commande: couleurs.orange,
  prete: couleurs.vert,
};

type Props = {
  numero: number;
  etat: EtatTable;
  infos?: InfosTable;
  onClientArrive: () => void;
  onLiberer: () => void;
};

export default function CaseTable({
  numero,
  etat,
  infos,
  onClientArrive,
  onLiberer,
}: Props) {
  return (
    <div className="space-y-2">
      <Link
        href={`/table/${numero}`}
        className={`w-full flex flex-col justify-center text-center ${COULEUR_ETAT[etat]} text-white rounded-2xl p-4 sm:p-6 min-h-[120px] sm:min-h-[130px] transition-all duration-300 hover:scale-[1.02] ${effetBouton}`}
      >
        <div className="text-2xl sm:text-2xl font-bold">Table {numero}</div>

        {infos?.nom && (
          <div className="mt-2 text-base sm:text-lg truncate">{infos.nom}</div>
        )}

        {infos?.telephone && (
          <div className="text-xs sm:text-sm opacity-80 truncate">
            {infos.telephone}
          </div>
        )}

        {infos && infos.personnes > 0 && (
          <div className="text-xs sm:text-sm opacity-80">
            {infos.personnes} pers.
          </div>
        )}
      </Link>

      {etat === "libre" ? (
        <button
          type="button"
          onClick={onClientArrive}
          className={`w-full ${couleurs.bleu} text-white rounded-xl py-3 text-base font-bold ${effetBouton}`}
        >
          Client arrivé
        </button>
      ) : (
        <button
          type="button"
          onClick={onLiberer}
          className={`w-full ${couleurs.rouge} text-white rounded-xl py-3 text-base font-bold ${effetBouton}`}
        >
          Libérer
        </button>
      )}
    </div>
  );
}
