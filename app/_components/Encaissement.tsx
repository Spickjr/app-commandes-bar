"use client";

import { useState } from "react";
import type { ModePaiement } from "../_lib/store";
import { arrondir, formatEuros, lireMontant } from "../_lib/argent";
import { boutons, effetBouton } from "../_lib/styles";

type Props = {
  table: string;
  reste: number;
  personnes: number;
  onEncaisser: (montant: number, mode: ModePaiement) => Promise<boolean>;
  onFermer: () => void;
};

const champ =
  "h-14 w-full rounded-[14px] border border-ligne bg-fond px-4 text-2xl font-semibold text-texte outline-none focus:border-doux";

// Fenêtre d'encaissement : montant (tout, ou part d'un partage), mode de
// paiement, et monnaie à rendre pour les espèces.
export default function Encaissement({
  table,
  reste,
  personnes,
  onEncaisser,
  onFermer,
}: Props) {
  const [saisie, setSaisie] = useState(String(reste).replace(".", ","));
  const [mode, setMode] = useState<ModePaiement>("cb");
  const [recu, setRecu] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  const montant = lireMontant(saisie);
  const montantValide = montant > 0 && montant <= reste + 0.001;
  const montantRecu = lireMontant(recu);
  const aRendre = recu && montantRecu >= montant ? arrondir(montantRecu - montant) : null;

  // Parts proposées pour les clients qui paient séparément.
  const parts = [...new Set([2, 3, 4, personnes])]
    .filter((n) => n >= 2 && n <= 20)
    .sort((a, b) => a - b);

  const choisir = (valeur: number) => {
    setSaisie(String(arrondir(valeur)).replace(".", ","));
    setErreur("");
  };

  const valider = async () => {
    if (!montantValide) {
      setErreur(
        montant > reste
          ? `Le montant dépasse le reste à payer (${formatEuros(reste)}).`
          : "Entre un montant."
      );
      return;
    }

    setEnCours(true);
    setErreur("");

    const ok = await onEncaisser(montant, mode);

    if (ok) {
      onFermer();
    } else {
      setErreur("Paiement non enregistré : vérifie le réseau et réessaie.");
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
        aria-labelledby="titre-encaissement"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-carte p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-[28px]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="titre-encaissement" className="text-xl font-semibold">
            Encaisser · {table}
          </h2>
          <span className="text-sm text-doux">Reste {formatEuros(reste)}</span>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-doux">
          Montant payé
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={saisie}
              onChange={(e) => {
                setSaisie(e.target.value);
                setErreur("");
              }}
              className={`${champ} pr-10`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-doux">
              €
            </span>
          </div>
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choisir(reste)}
            className={`h-10 rounded-full px-4 text-sm ${boutons.secondaire}`}
          >
            Tout
          </button>

          {parts.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => choisir(reste / n)}
              className={`h-10 rounded-full px-4 text-sm ${boutons.secondaire}`}
            >
              ÷ {n}
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Mode de paiement" className="grid grid-cols-2 gap-2">
          {(
            [
              { valeur: "cb", label: "CB", detail: "SumUp" },
              { valeur: "especes", label: "Espèces", detail: "Liquide" },
            ] as const
          ).map((option) => (
            <button
              type="button"
              key={option.valeur}
              role="radio"
              aria-checked={mode === option.valeur}
              onClick={() => setMode(option.valeur)}
              className={`flex min-h-16 flex-col items-start justify-center rounded-2xl border px-4 text-left ${effetBouton} ${
                mode === option.valeur
                  ? "border-texte bg-carte-2"
                  : "border-ligne"
              }`}
            >
              <span className="text-base font-semibold">{option.label}</span>
              <span className="text-[13px] text-doux">{option.detail}</span>
            </button>
          ))}
        </div>

        {mode === "especes" && (
          <label className="flex flex-col gap-2 text-sm font-medium text-doux">
            Reçu du client (facultatif)
            <input
              type="text"
              inputMode="decimal"
              value={recu}
              onChange={(e) => setRecu(e.target.value)}
              placeholder="ex : 50"
              className="h-12 w-full rounded-[14px] border border-ligne bg-fond px-4 text-lg text-texte outline-none placeholder:text-doux/60 focus:border-doux"
            />
            {aRendre !== null && (
              <span className="text-base font-semibold text-sauge">
                À rendre : {formatEuros(aRendre)}
              </span>
            )}
          </label>
        )}

        {erreur && (
          <p role="alert" className="text-sm font-semibold text-rouge">
            {erreur}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onFermer}
            className={`h-[54px] text-[15px] ${boutons.secondaire}`}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={valider}
            disabled={enCours || !montantValide}
            className={`h-[54px] text-[15px] ${boutons.principal}`}
          >
            {enCours
              ? "Enregistrement…"
              : montantValide
                ? `Encaisser ${formatEuros(montant)}`
                : "Encaisser"}
          </button>
        </div>
      </div>
    </div>
  );
}
