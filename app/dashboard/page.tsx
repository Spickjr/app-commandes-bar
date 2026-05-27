"use client";

import Link from "next/link";
import { useCommandeStore } from "../store";

export default function DashboardPage() {
  const historique = useCommandeStore((state) => state.historique);
  const supprimerHistorique = useCommandeStore((state) => state.supprimerHistorique);
  const viderHistorique = useCommandeStore((state) => state.viderHistorique);

  const effetBouton =
    "transition-all duration-150 active:scale-95 active:opacity-80";

  const totalCommande = (items: { prix: number; quantite: number }[]) =>
    items.reduce((total, item) => total + item.prix * item.quantite, 0);

  const totalSoiree = historique.reduce(
    (total, commande) => total + totalCommande(commande.items),
    0
  );

  const totalBoissons = historique.reduce(
    (total, commande) =>
      total +
      commande.items.reduce(
        (sousTotal, item) => sousTotal + item.quantite,
        0
      ),
    0
  );

  const ventesParBoisson: Record<
    string,
    { quantite: number; total: number }
  > = {};

  historique.forEach((commande) => {
    commande.items.forEach((item) => {
      if (!ventesParBoisson[item.nom]) {
        ventesParBoisson[item.nom] = { quantite: 0, total: 0 };
      }

      ventesParBoisson[item.nom].quantite += item.quantite;
      ventesParBoisson[item.nom].total += item.prix * item.quantite;
    });
  });

  const topBoissons = Object.entries(ventesParBoisson).sort(
    (a, b) => b[1].quantite - a[1].quantite
  );

  const historiqueParTable = historique.reduce((acc, commande) => {
    if (!acc[commande.table]) {
      acc[commande.table] = [];
    }

    acc[commande.table].push(commande);
    return acc;
  }, {} as Record<string, typeof historique>);

  const genererRapportPDF = () => {
    const date = new Date().toLocaleString("fr-FR");

    const lignesBoissons = topBoissons
      .map(
        ([nom, stats]) => `
          <tr>
            <td>${nom}</td>
            <td style="text-align:center;">${stats.quantite}</td>
            <td style="text-align:right;">${stats.total} €</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <html>
        <head>
          <title>Rapport Of Course</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #111;
            }

            h1 {
              text-align: center;
              margin-bottom: 5px;
            }

            .date {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
            }

            .stats {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 16px;
              margin-bottom: 30px;
            }

            .card {
              border: 1px solid #ddd;
              border-radius: 12px;
              padding: 18px;
            }

            .label {
              color: #666;
              font-size: 14px;
            }

            .value {
              font-size: 30px;
              font-weight: bold;
              margin-top: 8px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              padding: 12px;
              border-bottom: 1px solid #ddd;
            }

            th {
              background: #111;
              color: white;
              text-align: left;
            }

            .total {
              margin-top: 30px;
              font-size: 24px;
              font-weight: bold;
              text-align: right;
            }
          </style>
        </head>

        <body>
          <h1>Rapport Of Course</h1>
          <div class="date">${date}</div>

          <div class="stats">
            <div class="card">
              <div class="label">CA total soirée</div>
              <div class="value">${totalSoiree} €</div>
            </div>

            <div class="card">
              <div class="label">Commandes terminées</div>
              <div class="value">${historique.length}</div>
            </div>

            <div class="card">
              <div class="label">Boissons vendues</div>
              <div class="value">${totalBoissons}</div>
            </div>
          </div>

          <h2>Détail des ventes</h2>

          <table>
            <thead>
              <tr>
                <th>Boisson</th>
                <th style="text-align:center;">Quantité</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lignesBoissons || `<tr><td colspan="3">Aucune vente</td></tr>`}
            </tbody>
          </table>

          <div class="total">Total : ${totalSoiree} €</div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `;

    const fenetre = window.open("", "_blank");

    if (!fenetre) {
      alert("Pop-up bloquée. Autorise les pop-ups pour exporter le PDF.");
      return;
    }

    fenetre.document.write(html);
    fenetre.document.close();
  };

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
            onClick={genererRapportPDF}
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
        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">Total soirée</p>
          <p className="text-4xl font-bold mt-2">{totalSoiree} €</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">
            Commandes terminées
          </p>
          <p className="text-4xl font-bold mt-2">{historique.length}</p>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5">
          <p className="text-zinc-400 text-sm sm:text-base">Boissons vendues</p>
          <p className="text-4xl font-bold mt-2">{totalBoissons}</p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-2xl p-5 mb-6">
        <h2 className="text-2xl font-bold mb-4">Top boissons</h2>

        {topBoissons.length === 0 ? (
          <p className="text-zinc-400">Aucune vente pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {topBoissons.map(([nom, stats], index) => (
              <div
                key={nom}
                className="flex justify-between gap-3 bg-zinc-800 rounded-xl p-4 text-base sm:text-xl"
              >
                <span className="break-words">
                  #{index + 1} — {nom}
                </span>

                <span className="font-bold shrink-0">
                  x{stats.quantite} — {stats.total} €
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
          <div key={table} className="bg-zinc-900 rounded-2xl p-5">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 leading-tight">
              {table} — Total :{" "}
              {commandes.reduce(
                (total, commande) => total + totalCommande(commande.items),
                0
              )}{" "}
              €
            </h2>

            <div className="space-y-3">
              {commandes.map((commande, index) => (
                <div key={commande.id} className="bg-zinc-800 rounded-xl p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <p className="font-bold mb-2 text-lg">
                        Commande {index + 1}
                      </p>

                      <p className="text-orange-400 font-bold mb-3 text-sm sm:text-base">
                        Serveur : {commande.serveur || "Non renseigné"}
                      </p>

                      <div className="space-y-2">
                        {commande.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between gap-3 text-sm sm:text-lg"
                          >
                            <span className="break-words">
                              • {item.nom} x{item.quantite}
                            </span>

                            <span className="font-bold shrink-0">
                              {item.prix * item.quantite} €
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xl font-bold mt-4">
                        Total : {totalCommande(commande.items)} €
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => supprimerHistorique(commande.id)}
                      className={`bg-red-600 px-4 py-3 rounded-xl font-bold text-sm sm:text-base ${effetBouton}`}
                    >
                      Effacer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}