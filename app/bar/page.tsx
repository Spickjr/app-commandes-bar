"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCommandeStore } from "../_lib/store";
import { supabase } from "../_lib/supabase";
import { effetBouton } from "../_lib/styles";
import CommandeBar from "../_components/CommandeBar";

// Durée pendant laquelle une nouvelle commande reste mise en avant.
const DUREE_NOUVELLE_MS = 5000;

export default function BarPage() {
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const marquerPrete = useCommandeStore((state) => state.marquerPrete);
  const terminerCommande = useCommandeStore((state) => state.terminerCommande);

  const [nouvellesCommandes, setNouvellesCommandes] = useState<number[]>([]);

  useEffect(() => {
    chargerCommandes();

    // Signal visuel (et vibration) à l'arrivée d'une commande. Pas de son :
    // l'app est utilisée en soirée avec musique forte.
    const channel = supabase
      .channel("bar-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "commandes",
        },
        (payload) => {
          const nouvelleCommande = payload.new as { id: number };

          setNouvellesCommandes((anciennes) => [
            ...anciennes,
            nouvelleCommande.id,
          ]);

          if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300]);
          }

          setTimeout(() => {
            setNouvellesCommandes((anciennes) =>
              anciennes.filter((id) => id !== nouvelleCommande.id)
            );
          }, DUREE_NOUVELLE_MS);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chargerCommandes]);

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold leading-tight">Commandes</h1>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          <Link
            href="/dashboard"
            className={`bg-green-600 text-center px-4 py-3 rounded-2xl text-lg font-bold ${effetBouton}`}
          >
            Dashboard
          </Link>

          <Link
            href="/"
            className={`bg-zinc-700 text-center px-4 py-3 rounded-2xl text-lg font-bold ${effetBouton}`}
          >
            Tables
          </Link>
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4">
        Commandes en cours
      </h2>

      <div className="space-y-4">
        {commandesBar.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-6 text-zinc-400">
            Aucune commande en cours.
          </div>
        ) : (
          commandesBar.map((commande) => (
            <CommandeBar
              key={commande.id}
              commande={commande}
              nouvelle={nouvellesCommandes.includes(commande.id)}
              onPrete={() => marquerPrete(commande.id)}
              onRecuperee={() => terminerCommande(commande.id)}
            />
          ))
        )}
      </div>
    </main>
  );
}
