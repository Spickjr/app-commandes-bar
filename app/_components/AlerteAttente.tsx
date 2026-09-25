"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCommandeStore } from "../_lib/store";
import { ALERTE_ATTENTE_MINUTES, ALERTE_RECUPERATION_MINUTES } from "../_lib/config";
import { estEnRetard, estPreteEnRetard, useMaintenant } from "../_lib/temps";
import { useRole } from "../_lib/session";

// Alerte d'urgence, différente selon le profil :
// - bar : commandes envoyées pas encore prêtes depuis ALERTE_ATTENTE_MINUTES ;
// - serveur : commandes prêtes pas encore récupérées depuis ALERTE_RECUPERATION_MINUTES.
// Fixée à l'écran partout, sauf sur l'écran du bar où elle est intégrée (`integree`).
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

  const enRetard = actif
    ? commandesBar.filter((c) =>
        pourLeBar ? estEnRetard(c, maintenant) : estPreteEnRetard(c, maintenant)
      )
    : [];
  const idsEnRetard = enRetard.map((c) => c.id).join(",");

  // Une vibration par commande qui passe en retard (sur les appareils qui le permettent).
  const dejaSignalees = useRef(new Set<number>());

  useEffect(() => {
    const nouvelles = enRetard.filter((c) => !dejaSignalees.current.has(c.id));
    if (nouvelles.length === 0) return;

    nouvelles.forEach((c) => dejaSignalees.current.add(c.id));
    navigator.vibrate?.([200, 100, 200, 100, 200]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsEnRetard]);

  if (enRetard.length === 0) return null;

  const tables = enRetard
    .map((c) => c.table.replace("Table ", ""))
    .join(", ");

  const plusieurs = enRetard.length > 1;

  const message = pourLeBar
    ? plusieurs
      ? `${enRetard.length} commandes en attente depuis plus de ${ALERTE_ATTENTE_MINUTES} min`
      : `Commande en attente depuis plus de ${ALERTE_ATTENTE_MINUTES} min`
    : plusieurs
      ? `${enRetard.length} commandes prêtes à récupérer depuis plus de ${ALERTE_RECUPERATION_MINUTES} min`
      : `Commande prête à récupérer depuis plus de ${ALERTE_RECUPERATION_MINUTES} min`;

  // Les serveurs voient l'alerte mais n'ont pas accès à l'écran du bar.
  const lienVersBar = pourLeBar && !integree;

  const classes = `flex items-center gap-3 rounded-2xl border border-rouge-bord bg-carte px-4 py-3 ${
    integree
      ? "mt-5"
      : `fixed inset-x-3 z-30 mx-auto max-w-md shadow-xl shadow-black/50 ${
          // Au-dessus de la barre du bas ; en haut sur la page d'une table
          // (le panier occupe le bas).
          chemin.startsWith("/table/")
            ? "top-[max(0.75rem,env(safe-area-inset-top))]"
            : "bottom-[calc(5.75rem+env(safe-area-inset-bottom))]"
        }`
  }`;

  const contenu = (
    <>
      <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-rouge" />
      <span className="flex min-w-0 grow flex-col">
        <span className="text-[15px] font-semibold text-rouge">{message}</span>
        <span className="truncate text-[13px] text-doux">
          Table{enRetard.length > 1 ? "s" : ""} {tables}
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
    <Link href="/bar" role="alert" className={classes}>
      {contenu}
    </Link>
  ) : (
    <div role="alert" className={classes}>
      {contenu}
    </div>
  );
}
