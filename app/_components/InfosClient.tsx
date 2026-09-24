"use client";

import { useState } from "react";
import type { InfosTable } from "../_lib/store";
import { effetBouton } from "../_lib/styles";

const aDesInfos = (infos?: InfosTable) =>
  Boolean(
    infos &&
      (infos.nom || infos.telephone || infos.personnes > 0 || infos.note)
  );

type Props = {
  infos?: InfosTable;
  onEnregistrer: (infos: InfosTable) => void;
};

// Bloc "Infos Client" d'une table : formulaire, puis résumé avec bouton Modifier.
// Astuce : le parent passe une `key` qui change avec les infos, pour que le
// formulaire se recharge quand un autre appareil les modifie.
export default function InfosClient({ infos, onEnregistrer }: Props) {
  const [modeEdition, setModeEdition] = useState(!aDesInfos(infos));

  const [nom, setNom] = useState(infos?.nom || "");
  const [telephone, setTelephone] = useState(infos?.telephone || "");
  const [personnes, setPersonnes] = useState(infos?.personnes || 0);
  const [note, setNote] = useState(infos?.note || "");

  const enregistrer = () => {
    onEnregistrer({ nom, telephone, personnes, note });
    setModeEdition(false);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Infos Client</h2>

        {!modeEdition && (
          <button
            type="button"
            onClick={() => setModeEdition(true)}
            className={`bg-blue-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
          >
            Modifier
          </button>
        )}
      </div>

      {modeEdition ? (
        <div className="grid gap-4">
          <input
            type="text"
            placeholder="Nom du client"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="bg-zinc-800 px-4 py-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="bg-zinc-800 px-4 py-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Nombre de personnes"
            value={personnes}
            onChange={(e) => setPersonnes(Number(e.target.value))}
            className="bg-zinc-800 px-4 py-3 rounded-xl"
          />

          <textarea
            placeholder="Note spéciale"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-zinc-800 px-4 py-3 rounded-xl"
          />

          <button
            type="button"
            onClick={enregistrer}
            className={`bg-blue-600 py-3 rounded-xl font-bold ${effetBouton}`}
          >
            Enregistrer les infos
          </button>
        </div>
      ) : (
        <div className="space-y-2 text-lg sm:text-xl">
          <p>Client : {infos?.nom || "Non renseigné"}</p>
          <p>Téléphone : {infos?.telephone || "Non renseigné"}</p>
          <p>Personnes : {infos?.personnes || 0}</p>
          <p>Note : {infos?.note || "Aucune"}</p>
        </div>
      )}
    </div>
  );
}
