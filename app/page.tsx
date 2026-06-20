"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandeStore } from "./store";

export default function Home() {
  const router = useRouter();

  const chargerCommandes = useCommandeStore((state) => state.chargerCommandes);
  const chargerTables = useCommandeStore((state) => state.chargerTables);
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const statutsTables = useCommandeStore((state) => state.statutsTables);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const setStatutTable = useCommandeStore((state) => state.setStatutTable);

  useEffect(() => {
    const serveur = localStorage.getItem("serveur");

    if (!serveur) {
      router.push("/serveur");
    }

    chargerCommandes();
    chargerTables();
  }, [router, chargerCommandes, chargerTables]);

  const tables = Array.from({ length: 40 }, (_, i) => i + 1);

  const serveur =
    typeof window !== "undefined"
      ? localStorage.getItem("serveur")
      : "";

  const couleurTable = (table: string) => {
    const commandeTable = commandesBar.find(
      (commande) => commande.table === table
    );

    if (commandeTable?.statut === "prête")
      return "bg-green-600 shadow-[0_0_35px_rgba(34,197,94,0.7)]";

    if (commandeTable?.statut === "envoyée")
      return "bg-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.7)]";

    const statut = statutsTables[table];

    if (statut === "prete")
      return "bg-green-600 shadow-[0_0_35px_rgba(34,197,94,0.7)]";

    if (statut === "commande")
      return "bg-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.7)]";

    if (statut === "occupée")
      return "bg-blue-600 shadow-[0_0_35px_rgba(37,99,235,0.7)]";

    return "bg-zinc-800";
  };

  const effetBouton =
    "transition-all duration-150 active:scale-95 active:opacity-80";

  const deconnexion = () => {
    localStorage.removeItem("serveur");
    localStorage.removeItem("connecte");

    router.push("/serveur");
  };

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
          <Link
            href="/dashboard"
            className={`bg-green-600 shadow-[0_0_35px_rgba(34,197,94,0.7)] text-white flex items-center justify-center px-3 py-3 rounded-2xl text-base sm:text-xl font-bold ${effetBouton}`}
          >
            Dashboard
          </Link>

          <Link
            href="/bar"
            className={`bg-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.7)] text-white flex items-center justify-center px-3 py-3 rounded-2xl text-base sm:text-xl font-bold ${effetBouton}`}
          >
            Commandes
          </Link>

          <button
            type="button"
            onClick={deconnexion}
            className={`bg-red-600 shadow-[0_0_35px_rgba(220,38,38,0.7)] text-white flex items-center justify-center px-3 py-3 rounded-2xl text-base sm:text-xl font-bold ${effetBouton}`}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:flex-wrap sm:gap-4">
        <div className="bg-zinc-800 text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base text-center">
          Gris → pas arrivé
        </div>

        <div className="bg-blue-600 shadow-[0_0_35px_rgba(37,99,235,0.7)] text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base text-center">
          Bleu → occupée
        </div>

        <div className="bg-orange-500 shadow-[0_0_35px_rgba(249,115,22,0.7)] text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base text-center">
          Orange → commande
        </div>

        <div className="bg-green-600 shadow-[0_0_35px_rgba(34,197,94,0.7)] text-white px-3 py-2 rounded-xl font-bold text-sm sm:text-base text-center">
          Vert → prête
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        {tables.map((numero) => {
          const table = `Table ${numero}`;
          const statut = statutsTables[table];
          const infos = infosTables[table];

          const commandeTable = commandesBar.find(
            (commande) => commande.table === table
          );

          const tableActive =
            statut === "occupée" ||
            statut === "commande" ||
            statut === "prete" ||
            commandeTable?.statut === "envoyée" ||
            commandeTable?.statut === "prête";

          return (
            <div key={numero} className="space-y-2">
              <Link href={`/table/${numero}`}>
                <button
                  type="button"
                  className={`w-full ${couleurTable(
                    table
                  )} text-white rounded-2xl p-4 sm:p-6 min-h-[120px] sm:min-h-[130px] transition-all duration-300 hover:scale-[1.02] ${effetBouton}`}
                >
                  <div className="text-2xl sm:text-2xl font-bold">
                    Table {numero}
                  </div>

                  {infos?.nom && (
                    <div className="mt-2 text-base sm:text-lg truncate">
                      {infos.nom}
                    </div>
                  )}

                  {infos?.telephone && (
                    <div className="text-xs sm:text-sm opacity-80 truncate">
                      {infos.telephone}
                    </div>
                  )}

                  {infos?.personnes > 0 && (
                    <div className="text-xs sm:text-sm opacity-80">
                      {infos.personnes} pers.
                    </div>
                  )}
                </button>
              </Link>

              {tableActive ? (
                <button
                  type="button"
                  onClick={() => setStatutTable(table, "libre")}
                  className={`w-full bg-red-600 shadow-[0_0_35px_rgba(220,38,38,0.7)] text-white rounded-xl py-3 text-base font-bold ${effetBouton}`}
                >
                  Libérer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStatutTable(table, "occupée")}
                  className={`w-full bg-blue-600 shadow-[0_0_35px_rgba(37,99,235,0.7)] text-white rounded-xl py-3 text-base font-bold ${effetBouton}`}
                >
                  Client arrivé
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}