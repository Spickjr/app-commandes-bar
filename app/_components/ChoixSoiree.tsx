"use client";

import { useEffect, useState } from "react";
import { useCommandeStore } from "../_lib/store";
import {
  memoriserSoireeDepuisAdresse,
  oublierSoireeDemandee,
  useSoireeDemandee,
} from "../_lib/soiree";
import { boutons } from "../_lib/styles";

// Arrivée depuis un événement PILOT : propose de démarrer sa soirée
// (commandes et paiements repartent de zéro, tables remises à zéro).
export default function ChoixSoiree() {
  const demandee = useSoireeDemandee();
  const soiree = useCommandeStore((state) => state.soiree);
  const disponibles = useCommandeStore((state) => state.soireesDisponibles);
  const demarrerSoiree = useCommandeStore((state) => state.demarrerSoiree);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    memoriserSoireeDepuisAdresse();
  }, []);

  // Déjà la soirée en cours : rien à demander.
  const dejaEnCours = demandee !== null && demandee.id === soiree?.id;
  useEffect(() => {
    if (dejaEnCours) oublierSoireeDemandee();
  }, [dejaEnCours]);

  if (!demandee || !disponibles || dejaEnCours) return null;

  const demarrer = async () => {
    setEnCours(true);
    setErreur("");
    if (await demarrerSoiree(demandee)) {
      oublierSoireeDemandee();
    } else {
      setErreur("Impossible de démarrer la soirée : vérifie le réseau et réessaie.");
    }
    setEnCours(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="titre-soiree"
      className="flex flex-col gap-4 rounded-3xl border border-ambre-bord bg-ambre-fond p-5"
    >
      <div className="flex flex-col gap-1.5">
        <h2 id="titre-soiree" className="text-lg font-semibold">
          Démarrer « {demandee.nom || "nouvelle soirée"} » ?
        </h2>
        <p className="text-[14px] leading-snug text-clair">
          Tous les appareils passent sur cette soirée : tables libérées,
          commandes et paiements repartent de zéro.
          {soiree?.nom
            ? ` Ceux de « ${soiree.nom} » restent rangés avec son événement.`
            : ""}
        </p>
      </div>

      {erreur && (
        <p role="alert" className="text-sm font-medium text-rouge">
          {erreur}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={oublierSoireeDemandee}
          disabled={enCours}
          className={`h-12 text-[15px] ${boutons.secondaire}`}
        >
          {soiree?.nom ? "Rester" : "Annuler"}
        </button>
        <button
          type="button"
          onClick={demarrer}
          disabled={enCours}
          className={`h-12 text-[15px] ${boutons.principal}`}
        >
          {enCours ? "Démarrage…" : "Démarrer"}
        </button>
      </div>
    </div>
  );
}
