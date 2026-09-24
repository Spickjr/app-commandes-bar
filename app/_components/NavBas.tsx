"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeCommandes, IconeDashboard, IconeTables } from "./Icones";

const LIENS = [
  { href: "/", label: "Tables", Icone: IconeTables },
  { href: "/bar", label: "Commandes", Icone: IconeCommandes },
  { href: "/dashboard", label: "Dashboard", Icone: IconeDashboard },
];

// Barre de navigation fixée en bas de l'écran.
export default function NavBas() {
  const chemin = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-carte-2 bg-fond/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-20 max-w-md items-center justify-around px-5 pb-2">
        {LIENS.map(({ href, label, Icone }) => {
          const actif = chemin === href;

          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`flex min-h-13 min-w-19 flex-col items-center justify-center gap-1 text-xs transition-colors ${
                actif ? "font-semibold text-texte" : "font-medium text-doux"
              }`}
            >
              <Icone />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
