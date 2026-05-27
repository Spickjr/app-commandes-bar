"use client";

import Link from "next/link";
import { useCommandeStore } from "../store";

export default function DashboardPage() {
  const historique = useCommandeStore((state) => state.historique);
  const supprimerHistorique = useCommandeStore(
    (state) => state.supprimerHistorique
  );
  const viderHistorique = useCommandeStore(
    (state) => state.viderHistorique
  );

  const effetBouton =
    "transition-all duration-150 active:scale-95 active:opacity-80";

  const totalCommande = (
    items: { prix: number; quantite: number }[]
  ) =>
    items.reduce(
      (total, item) => total + item.prix * item.quantite,
      0
    );

  const totalSoiree = historique.reduce(
    (total, commande) =>
      total + totalCommande(commande.items),
    0
  );

  const totalBoissons = historique.reduce(
    (total, commande) =>
      total +
      commande.items.reduce(
        (sousTotal, item) =>
          sousTotal + item.quantite,
        0
      ),
    0
  );

  const ventesParBoisson: Record<string, number> = {};

  historique.forEach((commande) => {
    commande.items.forEach((item) => {
      ventesParBoisson[item.nom] =
        (ventesParBoisson[item.nom] || 0) +
        item.quantite;
    });
  });

  const topBoissons = Object.entries(
    ventesParBoisson
  ).sort((a, b) => b[1] - a[1]);

  const historiqueParTable = historique.reduce(
    (acc, commande) => {
      if (!acc[commande.table]) {
        acc[commande.table] = [];
      }

      acc[commande.table].push(commande);

      return acc;
    },
    {} as Record<string, typeof historique>
  );

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold">
          Dashboard
        </h1>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Voulez-vous vraiment vider tout l'historique ?"
                )
              ) {
                viderHistorique();
              }
            }}
            className={`bg-red-700 px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Vider
          </button>

          <Link
            href="/bar"
            className={`bg-orange-500 text-center px-4 py-3 rounded-2xl font-bold text-base sm:text-lg ${effetBouton}`}
          >
            Commandes
          </Link>

          <Link
            href="/"
            className={`bg-zinc-700 text-center px-4 py-3 rounded-2xl font-bold text-base sm:text-lg col-span-2 sm:col-span-1 ${effetBouton}`}
          >
            Tables
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">
            Total soirée
          </p>

          <p className="text-4xl font-bold mt-2">
            {totalSoiree} €
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">
            Commandes terminées
          </p>

          <p className="text-4xl font-bold mt-2">
            {historique.length}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">
            Boissons vendues
          </p>

          <p className="text-4xl font-bold mt-2">
            {totalBoissons}
          </p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Top boissons
        </h2>

        {topBoissons.length === 0 ? (
          <p className="text-zinc-400">
            Aucune vente pour le moment.
          </p>
        ) : (
          <div className="space-y-3">
            {topBoissons.map(
              ([nom, quantite], index) => (
                <div
                  key={nom}
                  className="flex justify-between gap-3 bg-zinc-800 rounded-xl p-4 text-base sm:text-xl"
                >
                  <span className="break-words">
                    #{index + 1} — {nom}
                  </span>

                  <span className="font-bold shrink-0">
                    x{quantite}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold mb-4">
        Historique par table
      </h2>

      <div className="space-y-6">
        {Object.entries(historiqueParTable).map(
          ([table, commandes]) => (
            <div
              key={table}
              className="bg-zinc-900 rounded-2xl p-5"
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">
                {table} — Total :{" "}
                {commandes.reduce(
                  (total, commande) =>
                    total +
                    totalCommande(commande.items),
                  0
                )}{" "}
                €
              </h2>

              <div className="space-y-3">
                {commandes.map(
                  (commande, index) => (
                    <div
                      key={commande.id}
                      className="bg-zinc-800 rounded-xl p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <p className="font-bold mb-2 text-lg">
                            Commande {index + 1}
                          </p>

                          <p className="text-orange-400 font-bold mb-3 text-sm sm:text-base">
                            Serveur :{" "}
                            {commande.serveur ||
                              "Non renseigné"}
                          </p>

                          <div className="space-y-2">
                            {commande.items.map(
                              (item, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between gap-3 text-sm sm:text-lg"
                                >
                                  <span className="break-words">
                                    • {item.nom} x
                                    {item.quantite}
                                  </span>

                                  <span className="font-bold shrink-0">
                                    {item.prix *
                                      item.quantite}{" "}
                                    €
                                  </span>
                                </div>
                              )
                            )}
                          </div>

                          <p className="text-xl font-bold mt-4">
                            Total :{" "}
                            {totalCommande(
                              commande.items
                            )}{" "}
                            €
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            supprimerHistorique(
                              commande.id
                            )
                          }
                          className={`bg-red-600 px-4 py-3 rounded-xl font-bold text-sm sm:text-base ${effetBouton}`}
                        >
                          Effacer
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )
        )}
      </div>
    </main>
  );
}