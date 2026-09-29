"use client";

import { useSyncExternalStore } from "react";

import type { Soiree } from "./store";

// Soirée demandée depuis un événement du site PILOT (bouton « Caisse bar »
// → /serveur?soiree=<id>&nom=<nom>), en attente de confirmation sur cet appareil.
// La soirée en cours, elle, est dans Supabase (store : soiree).
const CLE = "soiree-demandee";
const abonnes = new Set<() => void>();

const lireBrut = () => {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
};

const abonner = (callback: () => void) => {
  abonnes.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    abonnes.delete(callback);
    window.removeEventListener("storage", callback);
  };
};

// Retient la soirée passée dans l'adresse, s'il y en a une.
export const memoriserSoireeDepuisAdresse = () => {
  const p = new URLSearchParams(window.location.search);
  const id = p.get("soiree");
  if (!id) return;

  try {
    localStorage.setItem(CLE, JSON.stringify({ id, nom: p.get("nom") || "" }));
  } catch {}
  abonnes.forEach((f) => f());
};

export const oublierSoireeDemandee = () => {
  try {
    localStorage.removeItem(CLE);
  } catch {}
  abonnes.forEach((f) => f());
};

export const useSoireeDemandee = (): Soiree | null => {
  const brut = useSyncExternalStore(abonner, lireBrut, () => null);
  if (!brut) return null;
  try {
    const s = JSON.parse(brut) as Soiree;
    return s.id ? s : null;
  } catch {
    return null;
  }
};
