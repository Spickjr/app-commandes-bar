"use client";

import { useState } from "react";
import type { ModePaiement } from "../_lib/store";
import { arrondir, formatEuros, lireMontant } from "../_lib/argent";
import { boutons, effetBouton } from "../_lib/styles";
import { lienPaiementSumUp, noterPaiementEnCours, sumupActif } from "../_lib/sumup";

type Props = {
  table: string;
  reste: number;
  serveur: string;
  onEncaisser: (montant: number, mode: ModePaiement) => Promise<boolean>;
  onFermer: () => void;
};

const PARTS_MAX = 50;

const champ =
  "h-14 w-full rounded-[14px] border border-ligne bg-fond px-4 text-2xl font-semibold text-texte outline-none focus:border-doux";

// Fenêtre d'encaissement : montant (tout, ou part d'un partage), mode de
// paiement, et monnaie à rendre pour les espèces.
export default function Encaissement({
  table,
  reste,
  serveur,
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

  // Nombre de parts pour les clients qui paient séparément (2 au départ).
  const [parts, setParts] = useState(2);
  const parPart = arrondir(reste / parts);

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

  // Ouvre l'app SumUp avec le montant ; le paiement est enregistré au retour
  // et SuiviSumUp en affiche le résultat en revenant dans l'appli.
  const payerAvecSumUp = () => {
    if (!montantValide) return;
    noterPaiementEnCours({ table, montant, serveur });
    const lien = lienPaiementSumUp({ table, montant, serveur });
    onFermer();
    window.location.assign(lien);
  };

  const avecSumUp = sumupActif && mode === "cb";

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

        <button
          type="button"
          onClick={() => choisir(reste)}
          className={`h-11 text-[15px] ${boutons.secondaire}`}
        >
          Tout · {formatEuros(reste)}
        </button>

        <div className="flex flex-col gap-3 rounded-2xl border border-ligne p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-semibold">Diviser en</span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Une part de moins"
                onClick={() => setParts((n) => Math.max(2, n - 1))}
                disabled={parts <= 2}
                className={`size-10 text-xl ${boutons.secondaire}`}
              >
                −
              </button>
              <span className="min-w-20 text-center text-[17px] font-semibold tabular-nums">
                {parts} parts
              </span>
              <button
                type="button"
                aria-label="Une part de plus"
                onClick={() => setParts((n) => Math.min(PARTS_MAX, n + 1))}
                disabled={parts >= PARTS_MAX}
                className={`size-10 text-xl ${boutons.secondaire}`}
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => choisir(parPart)}
            className={`h-11 text-[15px] ${boutons.secondaire}`}
          >
            Diviser : {formatEuros(parPart)} par personne
          </button>
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

        {avecSumUp && (
          <button
            type="button"
            onClick={payerAvecSumUp}
            disabled={!montantValide}
            className={`h-[54px] text-[15px] ${boutons.principal}`}
          >
            {montantValide
              ? `Payer avec SumUp · ${formatEuros(montant)}`
              : "Payer avec SumUp"}
          </button>
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
            className={`h-[54px] text-[15px] ${
              avecSumUp ? boutons.secondaire : boutons.principal
            }`}
          >
            {enCours
              ? "Enregistrement…"
              : avecSumUp
                ? "Déjà payé : noter"
                : montantValide
                  ? `Encaisser ${formatEuros(montant)}`
                  : "Encaisser"}
          </button>
        </div>
      </div>
    </div>
  );
}
