"use client";

import { useState } from "react";
import { effetBouton } from "../_lib/styles";
import { VERSION_APP } from "../_lib/version";

// Affichée dans le menu pour vérifier que tous les appareils ont la même.
const VERSION = VERSION_APP.slice(0, 7) || "locale";

type Props = {
  serveur: string;
  onDeconnexion: () => void;
};

// Pastille avec le prénom du serveur ; un appui ouvre le bouton de déconnexion.
export default function MenuServeur({ serveur, onDeconnexion }: Props) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        aria-expanded={ouvert}
        className={`flex min-h-9 items-center gap-2 rounded-full bg-carte py-1 pl-1 pr-3.5 ${effetBouton}`}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-bouton text-[13px] font-semibold">
          {serveur.charAt(0).toUpperCase() || "?"}
        </span>
        <span className="text-sm font-medium">{serveur || "…"}</span>
      </button>

      {ouvert && (
        <div className="absolute right-0 top-11 z-30 w-48 rounded-2xl border border-ligne bg-carte p-1.5 shadow-xl shadow-black/40">
          <button
            type="button"
            onClick={onDeconnexion}
            className={`flex h-11 w-full items-center rounded-xl px-3 text-sm font-semibold text-rouge hover:bg-carte-2 ${effetBouton}`}
          >
            Se déconnecter
          </button>

          <div className="px-3 pt-1 pb-1.5 text-xs text-doux">
            Version {VERSION}
          </div>
        </div>
      )}
    </div>
  );
}
