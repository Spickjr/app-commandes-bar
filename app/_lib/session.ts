"use client";

import { useSyncExternalStore } from "react";

// Connexion serveur, conservée dans le localStorage du téléphone.

const CLE_SERVEUR = "serveur";
const CLE_CONNECTE = "connecte";

export const lireServeur = () => localStorage.getItem(CLE_SERVEUR) || "";

export const connecterServeur = (nom: string) => {
  localStorage.setItem(CLE_SERVEUR, nom);
  localStorage.setItem(CLE_CONNECTE, "oui");
};

export const deconnecterServeur = () => {
  localStorage.removeItem(CLE_SERVEUR);
  localStorage.removeItem(CLE_CONNECTE);
};

const abonner = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

// Nom du serveur connecté ("" tant que la page n'est pas chargée côté navigateur).
export const useServeur = () =>
  useSyncExternalStore(abonner, lireServeur, () => "");
