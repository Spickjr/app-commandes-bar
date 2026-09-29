# PILOT

Outil de gestion d'événements (back-office, pas de billetterie) : événements,
dépenses, recettes, prévisionnel vs réel, prestataires, tâches, échéances,
stocks. Voir aussi le `CLAUDE.md` à la racine du dépôt (règles communes, lien
avec l'appli bar).

## Technique

- **Next.js 15** (App Router) — différent de l'appli bar (Next 16) : ce
  dossier a son propre `package.json`, `node_modules` et sa config.
- TypeScript strict, Tailwind CSS **v3** (thème clair/sombre dans
  `src/app/globals.css`), composants façon shadcn dans `src/components/ui`.
- **Prisma 5** sur PostgreSQL Supabase, schéma `pilot`
  (`DATABASE_URL` = pooler Supabase, port 6543,
  `?pgbouncer=true&schema=pilot`).
- NextAuth v5 (email + mot de passe), secret `AUTH_SECRET`.
- Vercel : projet `pilot`, dossier racine `pilot`, région `dub1`
  (`vercel.json`), à côté de la base.

## Organisation du code

- `prisma/schema.prisma` : modèle de données.
- `src/lib/session.ts` : **toute** page ou action serveur passe par
  `requireOrgContext()` (vérifie la connexion et l'organisation).
- `src/actions/*` : Server Actions (validation Zod + `assertCanWrite`).
- `src/lib/finance.ts` : seul endroit où vivent les calculs financiers
  (tests : `npm run test:finance`).
- `src/app/org/*` : pages de l'espace connecté ; onglets d'un événement dans
  `src/components/shared/event-nav.tsx`.

## Modifier la base

Pas de `prisma migrate` en production. Pour une nouvelle table ou colonne :
1. modifier `prisma/schema.prisma` ;
2. générer le SQL :
   `npx prisma migrate diff --from-schema-datamodel <ancien schéma> --to-schema-datamodel prisma/schema.prisma --script` ;
3. le ranger dans `pilot/supabase/<nom>.sql` en commençant par
   `set search_path to pilot;` et en finissant par
   `alter table pilot."<Table>" enable row level security;` ;
4. l'ajouter aussi à `pilot/supabase/tables.sql` (installation complète) ;
5. donner le script à l'utilisateur pour qu'il le lance dans Supabase.

## Vérifications avant une PR

```bash
cd pilot
npm ci
npx tsc --noEmit
DATABASE_URL="postgresql://…?schema=pilot" AUTH_SECRET=x npx next build
```
En local, une base PostgreSQL de test se remplit avec `npx prisma db push`
puis `npm run db:seed` (compte démo `demo@pilot.app` / `password123`).
