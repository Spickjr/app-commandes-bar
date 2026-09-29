import Link from "next/link";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ListChecks,
  Clock,
  Settings,
  Compass,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { SignOutButton } from "./sign-out-button";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/constants";

const NAV = [
  { href: "/org/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/org/events", label: "Événements", icon: CalendarDays },
  { href: "/org/suppliers", label: "Prestataires", icon: Users },
  { href: "/org/tasks", label: "Tâches", icon: ListChecks },
  { href: "/org/deadlines", label: "Échéances", icon: Clock },
  { href: "/org/settings", label: "Paramètres", icon: Settings },
];

export function AppShell({
  children,
  orgName,
  role,
  userName,
}: {
  children: React.ReactNode;
  orgName: string;
  role: OrgRole;
  userName: string;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card/40 px-3 py-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Compass className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-tight">PILOT</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-border pt-3 px-2">
          <p className="truncate text-sm font-medium">{orgName}</p>
          <p className="text-xs text-muted-foreground">{userName} · {ORG_ROLE_LABELS[role]}</p>
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-1 border-b border-border px-5">
          <ThemeToggle />
          <SignOutButton />
        </header>
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
