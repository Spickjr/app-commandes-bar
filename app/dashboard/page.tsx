"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCommandeStore } from "../_lib/store";
import { grouperParTable, statistiquesSoiree } from "../_lib/calculs";
import { genererRapportPDF } from "../_lib/rapport";
import { effetBouton } from "../_lib/styles";
import HistoriqueTable from "../_components/HistoriqueTable";

export default function DashboardPage() {
  const historique = useCommandeStore((state) => state.historique);
  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const supprimerHistorique = useCommandeStore((state) => state.supprimerHistorique);
  const viderHistorique = useCommandeStore((state) => state.viderHistorique);

  // Charge l'historique depuis Supabase, même si on arrive directement ici.
  useEffect(() => {
    chargerCommandes();
  }, [chargerCommandes]);

  const stats = statistiquesSoiree(historique);
  const historiqueParTable = grouperParTable(historique);

  const blocStat = [
    { label: "Total soirée", valeur: `${stats.totalSoiree} €` },
    { label: "Commandes terminées", valeur: stats.nombreCommandes },
    { label: "Boissons vendues", valeur: stats.totalBoissons },
  ];

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          <button
            type="button"
            onClick={() => {
              if (confirm("Voulez-vous vraiment vider tout l'historique ?")) {
                viderHistorique();
              }
            }}
            className={`bg-red-700 px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Vider
          </button>

          <button
            type="button"
            onClick={() => genererRapportPDF(stats)}
            className={`bg-blue-600 px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Rapport PDF
          </button>

          <Link
            href="/bar"
            className={`bg-orange-500 text-center px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Commandes
          </Link>

          <Link
            href="/"
            className={`bg-zinc-700 text-center px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Tables
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        {blocStat.map(({ label, valeur }) => (
          <div key={label} className="bg-zinc-900 rounded-2xl p-5">
            <p className="text-zinc-400 text-sm sm:text-base">{label}</p>
            <p className="text-4xl font-bold mt-2">{valeur}</p>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
        <h2 className="text-2xl font-bold mb-4">Top boissons</h2>

        {stats.ventesParBoisson.length === 0 ? (
          <p className="text-zinc-400">Aucune vente pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {stats.ventesParBoisson.map((vente, index) => (
              <div
                key={vente.nom}
                className="flex justify-between gap-3 bg-zinc-800 rounded-xl p-4 text-base sm:text-xl"
              >
                <span className="break-words">
                  #{index + 1} — {vente.nom}
                </span>

                <span className="font-bold shrink-0">
                  x{vente.quantite} — {vente.total} €
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4">
        Historique par table
      </h2>

      <div className="space-y-6">
        {Object.entries(historiqueParTable).map(([table, commandes]) => (
          <HistoriqueTable
            key={table}
            table={table}
            commandes={commandes}
            onEffacer={supprimerHistorique}
          />
        ))}
      </div>
    </main>
  );
}
