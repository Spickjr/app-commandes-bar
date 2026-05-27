"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCommandeStore } from "../store";

export default function BarPage() {
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const marquerPrete = useCommandeStore((state) => state.marquerPrete);
  const terminerCommande = useCommandeStore((state) => state.terminerCommande);

  useEffect(() => {
    chargerCommandes();
  }, [chargerCommandes]);

  const totalCommande = (items: { prix: number; quantite: number }[]) =>
    items.reduce((total, item) => total + item.prix * item.quantite, 0);

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-bold leading-tight">
          Commandes
        </h1>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-4">
          <Link
            href="/dashboard"
            className="bg-green-600 text-center px-4 py-3 rounded-2xl text-lg font-bold"
          >
            Dashboard
          </Link>

          <Link
            href="/"
            className="bg-zinc-700 text-center px-4 py-3 rounded-2xl text-lg font-bold"
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
            <div
              key={commande.id}
              className="bg-zinc-900 rounded-2xl p-4 sm:p-6"
            >
              <h2 className="text-2xl font-bold mb-1">
                {commande.table}
              </h2>

              <p className="text-orange-400 text-base sm:text-lg font-bold mb-4">
                Serveur : {commande.serveur || "Non renseigné"}
              </p>

              <div className="mb-4 space-y-2">
                {commande.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between gap-3 bg-zinc-800 rounded-xl p-3 text-base sm:text-xl"
                  >
                    <span className="break-words">
                      {item.nom} x{item.quantite}
                    </span>

                    <span className="font-bold shrink-0">
                      {item.prix * item.quantite} €
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-2xl sm:text-3xl font-bold mb-5">
                Total : {totalCommande(commande.items)} €
              </p>

              <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap">
                {commande.statut === "envoyée" ? (
                  <button
                    type="button"
                    onClick={() => marquerPrete(commande.id)}
                    className="bg-blue-500 px-4 py-3 rounded-xl font-bold text-lg"
                  >
                    Marquer prête
                  </button>
                ) : (
                  <div className="bg-green-600 px-4 py-3 rounded-xl font-bold text-lg text-center">
                    Prête ✅
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => terminerCommande(commande.id)}
                  className="bg-red-600 px-4 py-3 rounded-xl font-bold text-lg"
                >
                  Commande récupérée
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}