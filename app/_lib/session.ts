"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

// Connexion, conservée dans le localStorage de l'appareil.
// Deux profils : "serveur" (tables + historique) et "bar" (commandes + dashboard).

export type Role = "serveur" | "bar";

const CLE_SERVEUR = "serveur";
const CLE_ROLE = "role";
const CLE_CONNECTE = "connecte";

// Écran d'arrivée de chaque profil.
export const ACCUEIL: Record<Role, string> = {
  serveur: "/",
  bar: "/bar",
};

export const lireServeur = () => localStorage.getItem(CLE_SERVEUR) || "";

export const lireRole = (): Role | "" => {
  const role = localStorage.getItem(CLE_ROLE);
  if (role === "serveur" || role === "bar") return role;

  // Connexions d'avant les profils : un nom enregistré = un serveur.
  return lireServeur() ? "serveur" : "";
};

export const connecterServeur = (nom: string) => {
  localStorage.setItem(CLE_SERVEUR, nom);
  localStorage.setItem(CLE_ROLE, "serveur");
  localStorage.setItem(CLE_CONNECTE, "oui");
};

export const connecterBar = () => {
  localStorage.setItem(CLE_SERVEUR, "Bar");
  localStorage.setItem(CLE_ROLE, "bar");
  localStorage.setItem(CLE_CONNECTE, "oui");
};

export const deconnecterServeur = () => {
  localStorage.removeItem(CLE_SERVEUR);
  localStorage.removeItem(CLE_ROLE);
  localStorage.removeItem(CLE_CONNECTE);
};

const abonner = (callback: () => void) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

// Nom affiché ("" tant que la page n'est pas chargée côté navigateur).
export const useServeur = () =>
  useSyncExternalStore(abonner, lireServeur, () => "");

// Profil connecté ("" si personne, ou tant que la page charge).
export const useRole = () =>
  useSyncExternalStore<Role | "">(abonner, lireRole, () => "");

// Réserve une page à un profil : renvoie vers la connexion si personne n'est
// connecté, ou vers l'accueil de son profil sinon. Renvoie true quand la page
// peut s'afficher.
export const useAcces = (roleAutorise: Role) => {
  const router = useRouter();
  const role = useRole();

  useEffect(() => {
    const actuel = lireRole();

    if (!actuel) router.replace("/serveur");
    else if (actuel !== roleAutorise) router.replace(ACCUEIL[actuel]);
  }, [router, roleAutorise]);

  return role === roleAutorise;
};
