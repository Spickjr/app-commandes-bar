"use client";

import { useEffect, useRef, useState } from "react";
import { useCommandeStore } from "../_lib/store";
import {
  memoriserSoireeDepuisAdresse,
  oublierSoireeDemandee,
  useSoireeDemandee,
} from "../_lib/soiree";
import { ACCUEIL, lireRole } from "../_lib/session";
import { boutons } from "../_lib/styles";

// Déjà connecté sur cet appareil : on va directement dans l'appli.
const allerDansLAppli = () => {
  const role = lireRole();
  if (role) window.location.replace(ACCUEIL[role]);
};

// Arrivée depuis un événement PILOT (bouton « Caisse bar ») : sa soirée
// démarre automatiquement sur tous les appareils (tables remises à zéro,
// commandes et paiements repartent de zéro).
export default function ChoixSoiree() {
  const demandee = useSoireeDemandee();
  const soiree = useCommandeStore((state) => state.soiree);
  const disponibles = useCommandeStore((state) => state.soireesDisponibles);
  const demarrerSoiree = useCommandeStore((state) => state.demarrerSoiree);
  const [erreur, setErreur] = useState("");
  const [essai, setEssai] = useState(0);
  const lance = useRef("");

  useEffect(() => {
    memoriserSoireeDepuisAdresse();
  }, []);

  const dejaEnCours = demandee !== null && demandee.id === soiree?.id;

  useEffect(() => {
    if (!demandee || !disponibles) return;

    if (dejaEnCours) {
      oublierSoireeDemandee();
      allerDansLAppli();
      return;
    }

    // Un seul démarrage par soirée demandée (et par nouvel essai).
    const cle = `${demandee.id}-${essai}`;
    if (lance.current === cle) return;
    lance.current = cle;

    const demarrer = async () => {
      if (await demarrerSoiree(demandee)) {
        oublierSoireeDemandee();
        allerDansLAppli();
      } else {
        setErreur("Impossible d’ouvrir la soirée : vérifie le réseau.");
      }
    };

    demarrer();
  }, [demandee, disponibles, dejaEnCours, demarrerSoiree, essai]);

  if (!demandee || !disponibles || dejaEnCours) return null;

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-3xl border border-ambre-bord bg-ambre-fond p-5"
    >
      <p className="text-[15px] font-semibold">
        {erreur
          ? erreur
          : `Ouverture de la soirée « ${demandee.nom || "nouvelle soirée"} »…`}
      </p>

      {erreur && (
        <button
          type="button"
          onClick={() => {
            setErreur("");
            setEssai((n) => n + 1);
          }}
          className={`h-12 text-[15px] ${boutons.principal}`}
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
