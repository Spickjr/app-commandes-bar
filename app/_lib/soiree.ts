"use client";

import { useSyncExternalStore } from "react";

// Soirée en cours, ouverte depuis un événement du site PILOT
// (bouton « Caisse bar » → /serveur?soiree=<id>&nom=<nom>).
export type Soiree = { id: string; nom: string };

const CLE = "soiree";
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

export const useSoiree = (): Soiree | null => {
  const brut = useSyncExternalStore(abonner, lireBrut, () => null);
  if (!brut) return null;
  try {
    const s = JSON.parse(brut) as Soiree;
    return s.id ? s : null;
  } catch {
    return null;
  }
};
