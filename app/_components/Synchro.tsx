"use client";

import { useEffect } from "react";
import { useCommandeStore } from "../_lib/store";

// Filet de sécurité si le temps réel rate un changement (veille, réseau…).
const INTERVALLE_MS = 10_000;

// Garde chaque appareil synchronisé avec Supabase :
// au démarrage, au retour dans l'app, au retour du réseau et régulièrement.
export default function Synchro() {
  const synchroniser = useCommandeStore((state) => state.synchroniser);

  useEffect(() => {
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

  return null;
}
