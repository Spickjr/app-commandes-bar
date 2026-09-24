"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCommandeStore } from "../_lib/store";
import { verifierMiseAJour } from "../_lib/version";

// Filet de sécurité si le temps réel rate un changement (veille, réseau…).
const INTERVALLE_MS = 10_000;

// Garde chaque appareil synchronisé avec Supabase :
// au démarrage, au retour dans l'app, au retour du réseau et régulièrement.
// Affiche un bandeau si la base ne répond plus.
export default function Synchro() {
  const synchroniser = useCommandeStore((state) => state.synchroniser);
  const connexionOk = useCommandeStore((state) => state.connexionOk);
  const chemin = usePathname();

  // Au retour dans l'app, passe à la dernière version en ligne,
  // sauf pendant une prise de commande (le panier serait perdu).
  useEffect(() => {
    if (chemin.startsWith("/table/")) return;

    const siVisible = () => {
      if (document.visibilityState === "visible") verifierMiseAJour();
    };

    verifierMiseAJour();
    document.addEventListener("visibilitychange", siVisible);
    return () => document.removeEventListener("visibilitychange", siVisible);
  }, [chemin]);

  useEffect(() => {
    // Ancienne copie locale des données (versions précédentes) : on la supprime.
    try {
      localStorage.removeItem("commandes-bar");
    } catch {}

    const siVisible = () => {
      if (document.visibilityState === "visible") synchroniser();
    };

    synchroniser();

    const minuteur = setInterval(siVisible, INTERVALLE_MS);
    document.addEventListener("visibilitychange", siVisible);
    window.addEventListener("online", synchroniser);
    window.addEventListener("focus", siVisible);

    return () => {
      clearInterval(minuteur);
      document.removeEventListener("visibilitychange", siVisible);
      window.removeEventListener("online", synchroniser);
      window.removeEventListener("focus", siVisible);
    };
  }, [synchroniser]);

  if (connexionOk) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-0 z-40 bg-rouge-bord px-4 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] text-center text-sm font-semibold text-texte"
    >
      Connexion à la base perdue : l’affichage peut ne pas être à jour. Nouvel
      essai automatique…
    </div>
  );
}
