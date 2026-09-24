"use client";

import { useState } from "react";
import type { InfosTable } from "../_lib/store";
import { boutons, carte } from "../_lib/styles";

const aDesInfos = (infos?: InfosTable) =>
  Boolean(
    infos &&
      (infos.nom || infos.telephone || infos.personnes > 0 || infos.note)
  );

const champ =
  "h-12 w-full rounded-[14px] border border-ligne bg-fond px-4 text-base text-texte placeholder:text-doux/70 outline-none focus:border-doux";

type Props = {
  infos?: InfosTable;
  onEnregistrer: (infos: InfosTable) => void;
};

// Bloc "infos client" d'une table : formulaire, puis résumé avec bouton Modifier.
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

  if (!modeEdition) {
    const details = [
      infos?.personnes ? `${infos.personnes} personnes` : "",
      infos?.telephone || "",
    ].filter(Boolean);

    return (
      <div className={`flex items-start gap-3 p-4 ${carte}`}>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <div className="text-[17px] font-semibold">
            {infos?.nom || "Client sans nom"}
          </div>

          {details.length > 0 && (
            <div className="text-sm text-doux">{details.join(" · ")}</div>
          )}

          {infos?.note && (
            <div className="text-sm text-doux">Note : {infos.note}</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModeEdition(true)}
          className={`h-11 shrink-0 rounded-xl px-3.5 text-sm ${boutons.secondaire}`}
        >
          Modifier
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 p-4 ${carte}`}>
      <div className="text-[17px] font-semibold">Infos client</div>

      <input
        type="text"
        placeholder="Nom du client"
        aria-label="Nom du client"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className={champ}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="tel"
          placeholder="Téléphone"
          aria-label="Téléphone"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          className={champ}
        />

        <input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Personnes"
          aria-label="Nombre de personnes"
          value={personnes || ""}
          onChange={(e) => setPersonnes(Number(e.target.value))}
          className={champ}
        />
      </div>

      <textarea
        placeholder="Note spéciale"
        aria-label="Note spéciale"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className={`${champ} h-auto py-3`}
      />

      <button
        type="button"
        onClick={enregistrer}
        className={`h-12 ${boutons.principal}`}
      >
        Enregistrer
      </button>
    </div>
  );
}
