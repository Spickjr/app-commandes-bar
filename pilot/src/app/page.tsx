import Link from "next/link";
import { Compass, LayoutDashboard, Receipt, Wallet, Users, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS = [
  { name: "Free", price: "0€", desc: "Pour démarrer", features: ["1 événement actif", "Fonctions de base"] },
  { name: "Starter", price: "19€/mois", desc: "Petites structures", features: ["5 événements actifs", "Documents", "Export CSV"] },
  { name: "Pro", price: "49€/mois", desc: "Structures régulières", features: ["Événements illimités", "Analytics", "Comparaisons"] },
  { name: "Business", price: "Sur devis", desc: "Agences & collectivités", features: ["Multi-utilisateurs avancé", "Support prioritaire"] },
];

const FAQ = [
  { q: "PILOT est-il une billetterie ?", a: "Non. PILOT ne vend jamais de billets et ne gère aucune interface publique. C'est un outil de gestion interne pour les organisateurs." },
  { q: "Puis-je importer mes budgets Excel existants ?", a: "L'import CSV est prévu dans l'architecture et arrive en MVP2." },
  { q: "Mes données sont-elles isolées des autres organisations ?", a: "Oui, chaque organisation est strictement cloisonnée — aucun accès croisé n'est possible." },
];

export default function LandingPage() {
  return (
    <div>
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5" />
          <span className="text-sm font-semibold">PILOT</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Connexion</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Créer mon espace</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:py-28">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Pilotez vos événements.</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Budgets, dépenses, recettes, prestataires, documents et échéances. Toute votre gestion événementielle au même endroit.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Créer mon espace</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Vos événements ne devraient pas tenir dans 15 fichiers Excel.</h2>
        <p className="mt-3 text-muted-foreground">PILOT les rassemble — au lieu de fichiers, dossiers Drive et échanges par email éparpillés.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-xl font-semibold">Comment ça marche</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard icon={LayoutDashboard} title="Organisation → Événements" desc="Chaque événement a son propre espace. Votre organisation garde une vue d'ensemble sur tous." />
          <FeatureCard icon={Receipt} title="Dépenses & Recettes" desc="Prévisionnel, réel, engagé, payé, encaissé — tout est calculé automatiquement, jamais recalculé à la main." />
          <FeatureCard icon={Clock} title="Échéances centralisées" desc="Paiements, encaissements, tâches et documents regroupés dans une seule vue chronologique." />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-xl font-semibold">Vos finances, sous contrôle</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard icon={Wallet} title="Prévisionnel vs Réel" desc="Voyez immédiatement où votre budget a dérapé, poste par poste, en € et en %." />
          <FeatureCard icon={Users} title="Prestataires" desc="Un historique complet par prestataire, sur tous vos événements, sans ressaisie." />
          <FeatureCard icon={BarChart3} title="Analytics" desc="Répartition des dépenses, évolution dans le temps, comparaison entre événements." />
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="mb-8 text-center text-xl font-semibold">Tarifs</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PLANS.map((p) => (
            <div key={p.name} className="rounded-lg border border-border p-5">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="mt-1 text-2xl font-semibold">{p.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              <ul className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="mb-8 text-center text-xl font-semibold">Questions fréquentes</h2>
        <div className="flex flex-col gap-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <p className="font-medium">{f.q}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold">Enfin, je sais exactement où j&apos;en suis.</h2>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/signup">Créer mon espace</Link>
        </Button>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        PILOT — outil de gestion interne pour organisateurs d&apos;événements.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: typeof LayoutDashboard; title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border p-5">
      <Icon className="mb-3 h-5 w-5" strokeWidth={1.5} />
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
