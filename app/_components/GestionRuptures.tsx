"use client";

import { useState } from "react";
import { CARTE, CATEGORIES, nomSurUneLigne } from "../_lib/carte";
import { useCommandeStore } from "../_lib/store";
import { boutons } from "../_lib/styles";

// Fenêtre du bar : marquer / démarquer les boissons en rupture.
// Le changement est visible tout de suite sur tous les appareils.
export default function GestionRuptures({ onFermer }: { onFermer: () => void }) {
  const ruptures = useCommandeStore((state) => state.ruptures);
  const disponibles = useCommandeStore((state) => state.rupturesDisponibles);
  const basculerRupture = useCommandeStore((state) => state.basculerRupture);
  const [erreur, setErreur] = useState(false);

  const basculer = async (nom: string) => {
    setErreur(false);
    const ok = await basculerRupture(nom);
    if (!ok) setErreur(true);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onFermer}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-ruptures"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88dvh] w-full max-w-lg flex-col gap-4 rounded-t-[28px] bg-carte p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[28px]"
      >
        <div className="flex flex-col gap-1">
          <h2 id="titre-ruptures" className="text-xl font-semibold">
            Ruptures de stock
          </h2>
          <p className="text-sm text-doux">
            Une boisson en rupture ne peut plus être commandée, sur tous les
            téléphones.
          </p>
        </div>

        {!disponibles ? (
          <p className="rounded-2xl border border-rouge-bord p-4 text-sm text-rouge">
            Fonction pas encore activée : la table « ruptures » doit être créée
            dans Supabase.
          </p>
        ) : (
          <div className="-mx-1 flex flex-col gap-5 overflow-y-auto px-1">
            {CATEGORIES.map((categorie) => (
              <div key={categorie} className="flex flex-col gap-1">
                <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-doux">
                  {categorie}
                </span>

                {CARTE[categorie].map(({ nom }) => {
                  const enRupture = ruptures.includes(nom);

                  return (
                    <label
                      key={nom}
                      className="flex min-h-12 cursor-pointer items-center gap-3"
                    >
                      <span
                        className={`grow text-[15px] ${
                          enRupture ? "text-doux line-through" : ""
                        }`}
                      >
                        {nomSurUneLigne(nom).replace(/"/g, "")}
                      </span>

                      {enRupture && (
                        <span className="text-xs font-semibold text-rouge">
                          Rupture
                        </span>
                      )}

                      <input
                        type="checkbox"
                        role="switch"
                        checked={enRupture}
                        onChange={() => basculer(nom)}
                        aria-label={`${nomSurUneLigne(nom)} en rupture`}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-doux ${
                          enRupture ? "bg-rouge" : "bg-carte-2"
                        }`}
                      >
                        <span
                          className={`absolute top-1 size-5 rounded-full bg-texte transition-all ${
                            enRupture ? "left-6" : "left-1"
                          }`}
                        />
                      </span>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {erreur && (
          <p role="alert" className="text-sm font-semibold text-rouge">
            Supabase a refusé l’enregistrement : la table « ruptures » est
            protégée (RLS). Voir la correction à faire dans Supabase.
          </p>
        )}

        <button
          type="button"
          onClick={onFermer}
          className={`h-12 shrink-0 text-[15px] ${boutons.principal}`}
        >
          Terminé
        </button>
      </div>
    </div>
  );
}
