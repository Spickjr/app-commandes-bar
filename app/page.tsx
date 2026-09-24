"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCommandeStore } from "./_lib/store";
import { NUMEROS_TABLES, nomTable } from "./_lib/config";
import { deconnecterServeur, lireServeur, useServeur } from "./_lib/session";
import { STYLE_ETAT, etatTable } from "./_lib/tables";
import CaseTable from "./_components/CaseTable";
import EnTete from "./_components/EnTete";
import MenuServeur from "./_components/MenuServeur";
import NavBas from "./_components/NavBas";

export default function Home() {
  const router = useRouter();
  const serveur = useServeur();

  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const statutsTables = useCommandeStore((state) => state.statutsTables);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const setStatutTable = useCommandeStore((state) => state.setStatutTable);

  useEffect(() => {
    if (!lireServeur()) {
      router.push("/serveur");
    }
  }, [router]);

  const deconnexion = () => {
    deconnecterServeur();
    router.push("/serveur");
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-28">
      <EnTete
        surtitre="Of Course !"
        titre="Tables"
        aDroite={<MenuServeur serveur={serveur} onDeconnexion={deconnexion} />}
      />

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {Object.values(STYLE_ETAT).map(({ label, point }) => (
          <span key={label} className="flex items-center gap-1.5 text-[13px] text-doux">
            <span className={`size-2 rounded-full ${point}`} />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      <NavBas />
    </main>
  );
}
