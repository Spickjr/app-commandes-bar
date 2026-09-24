"use client";

import { useState } from "react";
import { boutons, effetBouton } from "../_lib/styles";

type Props = {
  source: number;
  tablesLibres: number[];
  onTransferer: (destination: number) => Promise<void>;
  onFermer: () => void;
};

// Fenêtre de choix de la table de destination, avec confirmation.
export default function TransfertTable({
  source,
  tablesLibres,
  onTransferer,
  onFermer,
}: Props) {
  const [choix, setChoix] = useState<number | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(false);

  const confirmer = async () => {
    if (choix === null) return;

    setEnCours(true);
    setErreur(false);

    try {
      await onTransferer(choix);
    } catch {
      setErreur(true);
      setEnCours(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-transfert"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col gap-4 rounded-t-[28px] bg-carte p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[28px]"
      >
        <div className="flex flex-col gap-1">
          <h2 id="titre-transfert" className="text-xl font-semibold">
            Transférer la table {source}
          </h2>
          <p className="text-sm text-doux">
            Le client, ses infos et toutes ses commandes (en cours et
            historique) passent sur la nouvelle table. La table {source}
            redevient libre.
          </p>
        </div>

        {tablesLibres.length === 0 ? (
          <p className="text-[15px] text-doux">Aucune table libre.</p>
        ) : (
          <div className="grid grid-cols-5 gap-2 overflow-y-auto sm:grid-cols-6">
            {tablesLibres.map((numero) => (
              <button
                type="button"
                key={numero}
                onClick={() => setChoix(numero)}
                aria-pressed={choix === numero}
                className={`h-12 rounded-xl text-base font-semibold ${effetBouton} ${
                  choix === numero ? "bg-texte text-fond" : "bg-carte-2 text-texte"
                }`}
              >
                {numero}
              </button>
            ))}
          </div>
        )}

        {erreur && (
          <p role="alert" className="text-sm font-semibold text-rouge">
            Transfert incomplet : vérifie le réseau et les deux tables.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onFermer}
            className={`h-12 text-[15px] ${boutons.secondaire}`}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={confirmer}
            disabled={choix === null || enCours}
            className={`h-12 text-[15px] ${boutons.principal}`}
          >
            {enCours
              ? "Transfert…"
              : choix === null
                ? "Choisir une table"
                : `Vers la table ${choix}`}
          </button>
        </div>
      </div>
    </div>
  );
}
