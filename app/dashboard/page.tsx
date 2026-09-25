"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandeStore } from "../_lib/store";
import { nomSurUneLigne } from "../_lib/carte";
import {
  grouperParTable,
  statistiquesEncaissement,
  statistiquesSoiree,
} from "../_lib/calculs";
import { formatEuros } from "../_lib/argent";
import { genererRapportPDF } from "../_lib/rapport";
import { boutons, carte } from "../_lib/styles";
import { deconnecterServeur, useAcces, useServeur } from "../_lib/session";
import EnTete from "../_components/EnTete";
import HistoriqueTable from "../_components/HistoriqueTable";
import { IconeTelecharger } from "../_components/Icones";
import ListePaiements from "../_components/ListePaiements";
import MenuServeur from "../_components/MenuServeur";
import NavBas from "../_components/NavBas";

export default function DashboardPage() {
  const router = useRouter();
  const autorise = useAcces("bar");
  const nom = useServeur();
  const historique = useCommandeStore((state) => state.historique);
  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const supprimerHistorique = useCommandeStore((state) => state.supprimerHistorique);
  const viderHistorique = useCommandeStore((state) => state.viderHistorique);
  const reinitialiserTables = useCommandeStore(
    (state) => state.reinitialiserTables
  );
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const paiements = useCommandeStore((state) => state.paiements);
  const paiementsDisponibles = useCommandeStore((state) => state.paiementsDisponibles);
  const annulerPaiement = useCommandeStore((state) => state.annulerPaiement);

  // Charge l'historique depuis Supabase, même si on arrive directement ici.
  useEffect(() => {
    chargerCommandes();
  }, [chargerCommandes]);

  const stats = statistiquesSoiree(historique);
  const historiqueParTable = grouperParTable(historique);
  const quantiteMax = stats.ventesParBoisson[0]?.quantite || 1;
  const encaissement = paiementsDisponibles
    ? statistiquesEncaissement([...historique, ...commandesBar], paiements)
    : null;

  if (!autorise) return null;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-28">
      <EnTete
        surtitre="Soirée en cours"
        titre="Dashboard"
        aDroite={
          <MenuServeur
            serveur={nom}
            onDeconnexion={() => {
              deconnecterServeur();
              router.push("/serveur");
            }}
          />
        }
      />

      <div className="mt-5 flex flex-col gap-3">
        <div className={`flex flex-col gap-1 p-[18px] ${carte}`}>
          <span className="text-sm text-doux">Chiffre d’affaires</span>
          <span className="text-[40px] font-semibold leading-tight tracking-[-0.03em]">
            {stats.totalSoiree} €
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`flex flex-col gap-1 p-4 ${carte}`}>
            <span className="text-sm text-doux">Commandes</span>
            <span className="text-[26px] font-semibold tracking-[-0.02em]">
              {stats.nombreCommandes}
            </span>
          </div>

          <div className={`flex flex-col gap-1 p-4 ${carte}`}>
            <span className="text-sm text-doux">Boissons</span>
            <span className="text-[26px] font-semibold tracking-[-0.02em]">
              {stats.totalBoissons}
            </span>
          </div>
        </div>

        {encaissement && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "CB SumUp", valeur: encaissement.cb, couleur: "" },
              { label: "Espèces", valeur: encaissement.especes, couleur: "" },
              {
                label: "Reste dû",
                valeur: encaissement.resteDu,
                couleur: encaissement.resteDu > 0 ? "text-ambre" : "text-sauge",
              },
            ].map(({ label, valeur, couleur }) => (
              <div key={label} className={`flex flex-col gap-1 p-4 ${carte}`}>
                <span className="text-sm text-doux">{label}</span>
                <span className={`text-xl font-semibold tracking-[-0.02em] ${couleur}`}>
                  {formatEuros(valeur)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => genererRapportPDF(stats, encaissement)}
            className={`h-12 text-[15px] ${boutons.secondaire}`}
          >
            <IconeTelecharger taille={18} />
            Rapport PDF
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  "Vider l'historique ? Les commandes terminées et tous les paiements de la soirée seront effacés."
                )
              ) {
                viderHistorique();
              }
            }}
            className={`h-12 text-[15px] ${boutons.danger}`}
          >
            Vider l’historique
          </button>
        </div>

        <button
          type="button"
          onClick={async () => {
            if (
              confirm(
                "Réinitialiser toutes les tables ? Elles repassent libres et les noms, téléphones, nombres de personnes et notes sont effacés."
              ) &&
              !(await reinitialiserTables())
            ) {
              alert("Réinitialisation impossible : vérifie le réseau et réessaie.");
            }
          }}
          className={`h-12 text-[15px] ${boutons.danger}`}
        >
          Réinitialiser les tables
        </button>

        <div className={`flex flex-col gap-3.5 p-[18px] ${carte}`}>
          <span className="text-base font-semibold">Top boissons</span>

          {stats.ventesParBoisson.length === 0 ? (
            <p className="text-[15px] text-doux">Aucune vente pour le moment.</p>
          ) : (
            stats.ventesParBoisson.map((vente) => (
              <div key={vente.nom} className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3 text-[15px]">
                  <span className="break-words">{nomSurUneLigne(vente.nom)}</span>
                  <span className="shrink-0 text-doux">
                    × {vente.quantite} · {vente.total} €
                  </span>
                </div>

                <div className="h-1.5 rounded-full bg-carte-2">
                  <div
                    className="h-1.5 rounded-full bg-clair"
                    style={{ width: `${(vente.quantite / quantiteMax) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {paiementsDisponibles && (
          <ListePaiements paiements={paiements} onAnnuler={annulerPaiement} />
        )}

        <div className={`flex flex-col ${carte}`}>
          <span className="px-[18px] pt-[18px] pb-1.5 text-base font-semibold">
            Historique par table
          </span>

          {historique.length === 0 ? (
            <p className="px-[18px] pb-[18px] text-[15px] text-doux">
              Aucune commande terminée.
            </p>
          ) : (
            <div className="pb-1">
              {Object.entries(historiqueParTable).map(([table, commandes]) => (
                <HistoriqueTable
                  key={table}
                  table={table}
                  commandes={commandes}
                  onEffacer={supprimerHistorique}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NavBas />
    </main>
  );
}
