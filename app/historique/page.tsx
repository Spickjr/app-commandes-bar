"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandeStore } from "../_lib/store";
import { grouperParTable } from "../_lib/calculs";
import { deconnecterServeur, useAcces, useServeur } from "../_lib/session";
import { carte } from "../_lib/styles";
import EnTete from "../_components/EnTete";
import HistoriqueTable from "../_components/HistoriqueTable";
import MenuServeur from "../_components/MenuServeur";
import NavBas from "../_components/NavBas";

const numeroDe = (table: string) => Number(table.replace(/\D/g, "")) || 0;

// Historique des tables pour les serveurs : ce que chaque table a commandé
// (en cours et servi), en lecture seule.
export default function HistoriquePage() {
  const router = useRouter();
  const autorise = useAcces("serveur");
  const serveur = useServeur();

  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const historique = useCommandeStore((state) => state.historique);
  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);

  // Charge aussi les commandes terminées (la synchro régulière ne lit que celles en cours).
  useEffect(() => {
    chargerCommandes();
  }, [chargerCommandes]);

  if (!autorise) return null;

  const parTable = Object.entries(
    grouperParTable([...historique, ...commandesBar])
  ).sort(([a], [b]) => numeroDe(a) - numeroDe(b));

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28">
      <EnTete
        surtitre="Of Course !"
        titre="Historique"
        aDroite={
          <MenuServeur
            serveur={serveur}
            onDeconnexion={() => {
              deconnecterServeur();
              router.push("/serveur");
            }}
          />
        }
      />

      <div className={`mt-5 flex flex-col ${carte}`}>
        {parTable.length === 0 ? (
          <p className="p-[18px] text-[15px] text-doux">
            Aucune commande pour le moment.
          </p>
        ) : (
          <div className="py-1">
            {parTable.map(([table, commandes]) => (
              <HistoriqueTable key={table} table={table} commandes={commandes} />
            ))}
          </div>
        )}
      </div>

      <NavBas />
    </main>
  );
}
