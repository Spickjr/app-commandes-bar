"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandeStore } from "./_lib/store";
import { NUMEROS_TABLES, nomTable } from "./_lib/config";
import { deconnecterServeur, lireServeur, useServeur } from "./_lib/session";
import { etatTable } from "./_lib/tables";
import { couleurs, effetBouton } from "./_lib/styles";
import CaseTable from "./_components/CaseTable";

const LEGENDE = [
  { couleur: couleurs.gris, texte: "Gris → pas arrivé" },
  { couleur: couleurs.bleu, texte: "Bleu → occupée" },
  { couleur: couleurs.orange, texte: "Orange → commande" },
  { couleur: couleurs.vert, texte: "Vert → prête" },
];

export default function Home() {
  const router = useRouter();
  const serveur = useServeur();

  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const chargerTables = useCommandeStore((state) => state.chargerTables);
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const statutsTables = useCommandeStore((state) => state.statutsTables);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const setStatutTable = useCommandeStore((state) => state.setStatutTable);

  useEffect(() => {
    if (!lireServeur()) {
      router.push("/serveur");
    }

    chargerCommandes();
    chargerTables();
  }, [router, chargerCommandes, chargerTables]);

  const deconnexion = () => {
    deconnecterServeur();
    router.push("/serveur");
  };

  const boutonMenu = `text-white flex items-center justify-center px-3 py-3 rounded-2xl text-base sm:text-xl font-bold ${effetBouton}`;

  return (
    <main className="min-h-screen bg-black p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl sm:text-4xl font-bold text-white leading-tight">
            Gestion des Tables
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg font-medium mt-2">
            Serveur : {serveur}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:flex sm:gap-4">
          <Link href="/dashboard" className={`${couleurs.vert} ${boutonMenu}`}>
            Dashboard
          </Link>

          <Link href="/bar" className={`${couleurs.orange} ${boutonMenu}`}>
            Commandes
          </Link>

          <button
            type="button"
            onClick={deconnexion}
            className={`${couleurs.rouge} ${boutonMenu}`}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:flex-wrap sm:gap-4">
        {LEGENDE.map(({ couleur, texte }) => (
          <div
            key={texte}
            className={`${couleur} text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base text-center`}
          >
            {texte}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {NUMEROS_TABLES.map((numero) => {
          const table = nomTable(numero);

          const commandeEnCours = commandesBar.find(
            (commande) => commande.table === table
          );

          return (
            <CaseTable
              key={numero}
              numero={numero}
              etat={etatTable(statutsTables[table], commandeEnCours)}
              infos={infosTables[table]}
              onClientArrive={() => setStatutTable(table, "occupée")}
              onLiberer={() => setStatutTable(table, "libre")}
            />
          );
        })}
      </div>
    </main>
  );
}
