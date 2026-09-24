import type { StatistiquesEncaissement, StatistiquesSoiree } from "./calculs";
import { formatEuros } from "./argent";

// Rapport de fin de soirée : ouvre une fenêtre avec uniquement la synthèse
// puis lance l'impression (enregistrer en PDF depuis la boîte d'impression).

const echapper = (texte: string) =>
  texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const genererRapportPDF = (
  stats: StatistiquesSoiree,
  encaissement: StatistiquesEncaissement | null = null
) => {
  const date = new Date().toLocaleString("fr-FR");

  const lignesBoissons = stats.ventesParBoisson
    .map(
      (vente) => `
          <tr>
            <td>${echapper(vente.nom)}</td>
            <td style="text-align:center;">${vente.quantite}</td>
            <td style="text-align:right;">${vente.total} €</td>
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
              <div class="value">${stats.totalSoiree} €</div>
            </div>

            <div class="card">
              <div class="label">Commandes terminées</div>
              <div class="value">${stats.nombreCommandes}</div>
            </div>

            <div class="card">
              <div class="label">Boissons vendues</div>
              <div class="value">${stats.totalBoissons}</div>
            </div>
          </div>

          ${
            encaissement
              ? `
          <h2>Encaissements</h2>
          <div class="stats">
            <div class="card">
              <div class="label">CB (SumUp)</div>
              <div class="value">${formatEuros(encaissement.cb)}</div>
            </div>
            <div class="card">
              <div class="label">Espèces</div>
              <div class="value">${formatEuros(encaissement.especes)}</div>
            </div>
            <div class="card">
              <div class="label">Reste dû</div>
              <div class="value">${formatEuros(encaissement.resteDu)}</div>
            </div>
          </div>`
              : ""
          }

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

          <div class="total">Total : ${stats.totalSoiree} €</div>

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
