"use client";

import { useEffect, useState } from "react";
import { useCommandeStore } from "../_lib/store";
import { supabase } from "../_lib/supabase";
import { carte } from "../_lib/styles";
import CommandeBar from "../_components/CommandeBar";
import EnTete from "../_components/EnTete";
import NavBas from "../_components/NavBas";

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
    <main className="mx-auto w-full max-w-6xl px-5 pb-28">
      <EnTete
        surtitre="Bar"
        titre="Commandes"
        info={`${commandesBar.length} en cours`}
      />

      <div className="mt-5 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {commandesBar.length === 0 ? (
          <div className={`p-6 text-doux ${carte}`}>
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

      <NavBas />
    </main>
  );
}
