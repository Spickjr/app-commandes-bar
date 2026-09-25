"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCommandeStore, type Commande } from "../_lib/store";
import { ALERTE_ATTENTE_MINUTES, ALERTE_RECUPERATION_MINUTES } from "../_lib/config";
import { estEnRetard, estPreteEnRetard, useMaintenant } from "../_lib/temps";
import { useRole } from "../_lib/session";

type Alerte = {
  cle: string;
  commandes: Commande[];
  un: string;
  plusieurs: (n: number) => string;
};

// Alertes d'urgence :
// - bar : commandes envoyées pas encore prêtes depuis ALERTE_ATTENTE_MINUTES,
//   et commandes prêtes pas encore récupérées depuis ALERTE_RECUPERATION_MINUTES
//   (pour prévenir la salle) ;
// - serveur : seulement les commandes prêtes à récupérer.
// Fixées à l'écran partout, sauf sur l'écran du bar où elles sont intégrées (`integree`).
export default function AlerteAttente({ integree = false }: { integree?: boolean }) {
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const connexionOk = useCommandeStore((state) => state.connexionOk);
  const maintenant = useMaintenant();
  const chemin = usePathname();
  const role = useRole();

  const surLeBar = chemin === "/bar";
  const actif =
    connexionOk && chemin !== "/serveur" && (integree ? surLeBar : !surLeBar);
  const pourLeBar = role === "bar";

  const alertes: Alerte[] = actif
    ? [
        ...(pourLeBar
          ? [
              {
                cle: "attente",
                commandes: commandesBar.filter((c) => estEnRetard(c, maintenant)),
                un: `Commande en attente depuis plus de ${ALERTE_ATTENTE_MINUTES} min`,
                plusieurs: (n: number) =>
                  `${n} commandes en attente depuis plus de ${ALERTE_ATTENTE_MINUTES} min`,
              },
            ]
          : []),
        {
          cle: "recuperation",
          commandes: commandesBar.filter((c) => estPreteEnRetard(c, maintenant)),
          un: `Commande prête à récupérer depuis plus de ${ALERTE_RECUPERATION_MINUTES} min`,
          plusieurs: (n: number) =>
            `${n} commandes prêtes à récupérer depuis plus de ${ALERTE_RECUPERATION_MINUTES} min`,
        },
      ].filter((a) => a.commandes.length > 0)
    : [];

  const idsEnRetard = alertes
    .flatMap((a) => a.commandes.map((c) => `${a.cle}-${c.id}`))
    .join(",");

  // Une vibration à chaque nouvelle urgence (sur les appareils qui le permettent).
  const dejaSignalees = useRef(new Set<string>());

  useEffect(() => {
    const nouvelles = idsEnRetard
      .split(",")
      .filter((id) => id && !dejaSignalees.current.has(id));
    if (nouvelles.length === 0) return;

    nouvelles.forEach((id) => dejaSignalees.current.add(id));
    navigator.vibrate?.([200, 100, 200, 100, 200]);
  }, [idsEnRetard]);

  if (alertes.length === 0) return null;

  // Le lien vers l'écran du bar n'a de sens que pour le profil bar, ailleurs que sur le bar.
  const lienVersBar = pourLeBar && !integree;

  const conteneur = integree
    ? "mt-5 flex flex-col gap-2"
    : `fixed inset-x-3 z-30 mx-auto flex max-w-md flex-col gap-2 ${
        // Au-dessus de la barre du bas ; en haut sur la page d'une table
        // (le panier occupe le bas).
        chemin.startsWith("/table/")
          ? "top-[max(0.75rem,env(safe-area-inset-top))]"
          : "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
      }`;

  const classes = `flex items-center gap-3 rounded-2xl border border-rouge-bord bg-carte px-4 py-3 ${
    integree ? "" : "shadow-xl shadow-black/50"
  }`;

  return (
    <div className={conteneur}>
      {alertes.map((alerte) => {
        const n = alerte.commandes.length;
        const tables = alerte.commandes
          .map((c) => c.table.replace("Table ", ""))
          .join(", ");

        const contenu = (
          <>
            <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-rouge" />
            <span className="flex min-w-0 grow flex-col">
              <span className="text-[15px] font-semibold text-rouge">
                {n > 1 ? alerte.plusieurs(n) : alerte.un}
              </span>
              <span className="truncate text-[13px] text-doux">
                Table{n > 1 ? "s" : ""} {tables}
              </span>
            </span>
            {lienVersBar && (
              <span className="shrink-0 text-[13px] font-semibold text-texte">
                Voir
              </span>
            )}
          </>
        );

        return lienVersBar ? (
          <Link key={alerte.cle} href="/bar" role="alert" className={classes}>
            {contenu}
          </Link>
        ) : (
          <div key={alerte.cle} role="alert" className={classes}>
            {contenu}
          </div>
        );
      })}
    </div>
  );
}
