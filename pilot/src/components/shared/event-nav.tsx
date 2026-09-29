"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function EventNav({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/org/events/${eventId}`;
  const tabs = [
    { href: base, label: "Aperçu" },
    { href: `${base}/expenses`, label: "Dépenses" },
    { href: `${base}/revenues`, label: "Recettes" },
    { href: `${base}/forecast`, label: "Prévisionnel vs Réel" },
    { href: `${base}/tasks`, label: "Tâches" },
    { href: `${base}/stocks`, label: "Stocks" },
  ];

  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              active ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
