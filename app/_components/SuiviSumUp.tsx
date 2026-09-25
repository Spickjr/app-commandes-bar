"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useCommandeStore } from "../_lib/store";
import { formatEuros } from "../_lib/argent";
import { boutons } from "../_lib/styles";
import {
  abonnerPaiementEnCours,
  analyserPaiementEnCours,
  lienPaiementSumUp,
  lirePaiementEnCoursBrut,
  noterPaiementEnCours,
  oublierPaiementEnCours,
} from "../_lib/sumup";

// Marge sur l'heure d'enregistrement (horloges du téléphone et du serveur).
const MARGE_MS = 2 * 60_000;
// Durée d'affichage de la confirmation.
const CONFIRMATION_MS = 6000;

// Au retour de SumUp dans l'appli : dit si le paiement lancé depuis cet
// appareil a bien été enregistré (par la page /sumup/retour, ouverte dans
// Safari sur iPhone), sinon propose de réessayer.
export default function SuiviSumUp() {
  const brut = useSyncExternalStore(
    abonnerPaiementEnCours,
    lirePaiementEnCoursBrut,
    () => null
  );
  const paiements = useCommandeStore((state) => state.paiements);
  const chemin = usePathname();

  const enCours = analyserPaiementEnCours(brut);

  const valide =
    enCours !== null &&
    paiements.some(
      (p) =>
        p.id > 0 &&
        p.mode === "cb" &&
        p.table === enCours.table &&
        Math.abs(p.montant - enCours.montant) < 0.005 &&
        new Date(p.creeLe).getTime() >= enCours.depuis - MARGE_MS
    );

  // Confirmation affichée quelques secondes, puis on oublie le paiement.
  useEffect(() => {
    if (!valide) return;
    const minuteur = setTimeout(oublierPaiementEnCours, CONFIRMATION_MS);
    return () => clearTimeout(minuteur);
  }, [valide]);

  // Paiement expiré ou illisible : on nettoie.
  useEffect(() => {
    if (brut && !enCours) oublierPaiementEnCours();
  }, [brut, enCours]);

  if (!enCours || chemin.startsWith("/sumup")) return null;

  const reessayer = () => {
    noterPaiementEnCours(enCours);
    window.location.assign(lienPaiementSumUp(enCours));
  };

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-ligne bg-carte px-4 py-3 shadow-xl shadow-black/50"
    >
      {valide ? (
        <div className="flex items-center gap-3">
          <span className="size-2.5 shrink-0 rounded-full bg-sauge" />
          <span className="flex grow flex-col">
            <span className="text-[15px] font-semibold text-sauge">
              Paiement SumUp validé · {formatEuros(enCours.montant)}
            </span>
            <span className="text-[13px] text-doux">
              Enregistré en CB sur la {enCours.table.toLowerCase()}.
            </span>
          </span>
          <button
            type="button"
            onClick={oublierPaiementEnCours}
            className={`h-9 shrink-0 px-3 text-sm ${boutons.secondaire}`}
          >
            OK
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-ambre" />
            <span className="flex grow flex-col">
              <span className="text-[15px] font-semibold text-ambre">
                Paiement SumUp non confirmé · {formatEuros(enCours.montant)}
              </span>
              <span className="text-[13px] text-doux">
                {enCours.table} : s’il est passé dans SumUp, il s’affichera ici
                dans quelques secondes.
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={oublierPaiementEnCours}
              className={`h-11 text-sm ${boutons.secondaire}`}
            >
              Ignorer
            </button>
            <button
              type="button"
              onClick={reessayer}
              className={`h-11 text-sm ${boutons.principal}`}
            >
              Réessayer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
