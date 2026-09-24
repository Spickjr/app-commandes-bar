import Link from "next/link";
import type { InfosTable } from "../_lib/store";
import { STYLE_ETAT, type EtatTable } from "../_lib/tables";
import { boutons } from "../_lib/styles";
import { formatEuros } from "../_lib/argent";

type Props = {
  numero: number;
  etat: EtatTable;
  infos?: InfosTable;
  // Reste à payer (null si la table n'a rien commandé).
  reste?: number | null;
  onClientArrive: () => void;
  onLiberer: () => void;
};

export default function CaseTable({
  numero,
  etat,
  infos,
  reste = null,
  onClientArrive,
  onLiberer,
}: Props) {
  const style = STYLE_ETAT[etat];
  const libre = etat === "libre";

  return (
    <div
      className={`flex flex-col gap-3 rounded-[20px] p-3.5 transition-colors duration-300 ${style.fond}`}
    >
      <Link
        href={`/table/${numero}`}
        className="flex min-h-16 flex-col gap-1 rounded-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-2xl font-semibold tracking-[-0.02em]">
            {numero}
          </span>

          <span
            className={`rounded-full text-xs ${
              libre ? "font-medium" : "px-2.5 py-1 font-semibold"
            } ${style.pastille}`}
          >
            {style.label}
          </span>
        </div>

        {infos?.nom && (
          <div className="truncate text-[15px] font-medium">{infos.nom}</div>
        )}

        {infos && infos.personnes > 0 && (
          <div className="text-[13px] text-texte/60">
            {infos.personnes} pers.
          </div>
        )}

        {!libre && reste !== null && (
          <div
            className={`text-[13px] font-semibold ${
              reste > 0 ? "text-ambre" : "text-sauge"
            }`}
          >
            {reste > 0 ? `À régler ${formatEuros(reste)}` : "Réglée"}
          </div>
        )}
      </Link>

      {libre ? (
        <button
          type="button"
          onClick={onClientArrive}
          className={`h-11 text-sm ${boutons.secondaire}`}
        >
          Client arrivé
        </button>
      ) : (
        <button
          type="button"
          onClick={onLiberer}
          className={`h-11 rounded-2xl border text-sm font-semibold transition duration-150 active:scale-[0.97] active:opacity-80 ${style.bord}`}
        >
          Libérer
        </button>
      )}
    </div>
  );
}
