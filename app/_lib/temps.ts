"use client";

import { useSyncExternalStore } from "react";
import { ALERTE_ATTENTE_MINUTES } from "./config";
import type { Commande } from "./store";

// Horloge partagée : un seul minuteur (1 s) pour tous les chronos de l'écran.

let maintenant = 0;
let minuteur: ReturnType<typeof setInterval> | undefined;
const abonnes = new Set<() => void>();

const abonner = (callback: () => void) => {
  abonnes.add(callback);

  if (!minuteur) {
    maintenant = Date.now();
    minuteur = setInterval(() => {
      maintenant = Date.now();
      abonnes.forEach((f) => f());
    }, 1000);
  }

  return () => {
    abonnes.delete(callback);

    if (abonnes.size === 0) {
      clearInterval(minuteur);
      minuteur = undefined;
    }
  };
};

// Heure actuelle en ms, mise à jour chaque seconde (0 tant que la page charge).
export const useMaintenant = () =>
  useSyncExternalStore(
    abonner,
    () => maintenant,
    () => 0
  );

const SEUIL_MS = ALERTE_ATTENTE_MINUTES * 60 * 1000;

// Temps écoulé depuis l'envoi au bar (0 si l'heure n'est pas encore connue).
export const attenteMs = (commande: Commande, heure: number) =>
  heure && commande.creeLe
    ? Math.max(0, heure - new Date(commande.creeLe).getTime())
    : 0;

// Commande envoyée, pas encore prête, et qui attend depuis trop longtemps.
export const estEnRetard = (commande: Commande, heure: number) =>
  commande.statut === "envoyée" && attenteMs(commande, heure) >= SEUIL_MS;

// 83 000 ms → "1:23"
export const formatChrono = (ms: number) => {
  const secondes = Math.floor(ms / 1000);
  const minutes = Math.floor(secondes / 60);
  return `${minutes}:${String(secondes % 60).padStart(2, "0")}`;
};
