# PILOT

Outil de gestion interne pour organisateurs d'événements (associations, festivals, agences, collectivités, clubs…). PILOT n'est pas une billetterie : pas d'interface publique, pas de vente de billets — uniquement un back-office de pilotage financier et opérationnel.

## Stack

Next.js 15 (App Router) · TypeScript strict · Tailwind CSS · Prisma + PostgreSQL (Supabase) · NextAuth (credentials) · Zod · React Hook Form · Recharts.

> Le cahier des charges préconisait Supabase/PostgreSQL. Le schéma Prisma (`prisma/schema.prisma`) est écrit pour être portable vers PostgreSQL sans changement de modèle — il suffit de changer `provider = "postgresql"` et l'URL de connexion. SQLite est utilisé ici uniquement parce que ce build a été réalisé dans un environnement sans accès à un projet Supabase provisionné.

## Installation

```bash
npm install
cp .env.example .env
# éditer .env si besoin (AUTH_SECRET notamment — générer avec `openssl rand -base64 32`)

npx prisma db push       # crée dev.db et les tables
npm run db:seed          # organisation de démo "Hors Cadre Production" + 4 événements

npm run dev
```

Ouvrir http://localhost:3000. Se connecter avec le compte de démo :

- **Email** : `demo@pilot.app`
- **Mot de passe** : `password123`

Ou créer un nouveau compte via "Créer mon espace" (déclenche l'onboarding).

## Vérifications

```bash
npm run typecheck        # TypeScript strict
npm run test:finance     # tests du moteur de calcul financier (lib/finance.ts)
npm run build            # build de production
```

## Structure

```
prisma/schema.prisma       Schéma de données complet (17 modèles, cf. §36 du cahier des charges)
prisma/seed.ts              Données de démonstration
src/lib/finance.ts          Moteur de calcul financier centralisé — SEUL endroit où les formules existent
src/lib/session.ts          Porte d'entrée unique pour l'autorisation (org + rôle) — toute page/action y passe
src/actions/*                Server Actions (mutations) — validation Zod + vérification de rôle systématique
src/app/org/*                Espace applicatif protégé (dashboard, événements, prestataires, tâches, échéances, paramètres)
src/components/ui/*          Primitives d'interface (style shadcn)
src/components/shared/*      Composants métier réutilisables (StatCard, badges de statut, EmptyState…)
```

## Ce qui est livré (MVP1)

Authentification, organisation, onboarding, création d'événement, dashboard global, dashboard événement, dépenses, recettes, calculs financiers automatiques, prévisionnel vs réel, prestataires (avec historique), tâches, échéances. CRUD réel partout — rien de décoratif ; les points non encore implémentés (invitations de membres, modification du profil) sont explicitement marqués "Bientôt disponible" plutôt que simulés.

## Prochaines étapes (MVP2/MVP3, cf. cahier des charges §45)

Documents (upload réel — le modèle `Document` et la checklist `DocumentRequirement` existent déjà en base, l'UI reste à construire), intervenants, calendrier, bilan d'événement, analytics organisation, comparaison d'événements, import CSV, notifications avancées, gestion d'équipe avancée (rôles déjà modélisés : Owner/Admin/Manager/Member/Viewer).

## Sécurité

Toute lecture/écriture passe par `requireOrgContext()` côté serveur, qui vérifie la session et l'appartenance à l'organisation avant toute requête Prisma — aucun accès direct aux données sans cette vérification. Les Server Actions valident systématiquement le rôle (`assertCanWrite` / `assertCanAdmin`) avant toute mutation. En migrant vers Supabase, ce même modèle de vérification s'ajoute aux policies RLS (défense en profondeur), il ne les remplace pas.

## Mise en ligne (Supabase + Vercel)

- Base : PostgreSQL Supabase (même projet que l'appli Commandes Bar), tables dans le schéma `pilot`,
  inaccessibles aux clés publiques Supabase. Création : coller `supabase/tables.sql` dans Supabase → SQL Editor.
- Vercel : variables `DATABASE_URL` (pooler Supabase, port 6543, `?pgbouncer=true&schema=pilot`) et `AUTH_SECRET`.
- En local avec PostgreSQL : `DATABASE_URL="postgresql://…/pilot?schema=pilot"`, puis `npx prisma db push` et `npm run db:seed`.
