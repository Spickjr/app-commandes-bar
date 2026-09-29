@AGENTS.md

# Projet « Of Course ! » : appli bar + site PILOT

Ce dépôt contient **deux applications** qui partagent le même Supabase et le
même compte Vercel. Deux personnes y travaillent (chacune avec Claude) :

| Partie | Dossier | Responsable | En ligne |
|---|---|---|---|
| **Commandes Bar** (prise de commandes, bar, encaissement) | racine (`app/`, `public/`…) | Spickjr | projet Vercel `app-commandes-bar` |
| **PILOT** (gestion d'événements : dépenses, recettes, tâches, stocks) | `pilot/` | anthospg | projet Vercel `pilot` (dossier racine `pilot`) |

Avant de modifier la partie de l'autre, prévenir l'utilisateur.
L'utilisateur parle français : répondre en français, simplement.

## Règles de travail

- **`main` = production.** Chaque fusion sur `main` redéploie les deux projets
  Vercel. On ne pousse jamais directement sur `main`.
- On travaille sur une branche, on ouvre une **pull request**, on attend que
  les deux statuts Vercel (`Vercel – app-commandes-bar`, `Vercel – pilot`)
  soient verts, puis on fusionne.
- Toujours repartir de la dernière version de `main` avant de commencer.
- **Aucun secret dans le code ni dans les messages** : `DATABASE_URL`,
  `AUTH_SECRET`, mots de passe Supabase restent dans les variables Vercel.
- Toute nouvelle table ou colonne passe par un **script SQL** rangé dans le
  dépôt (`supabase/` ou `pilot/supabase/`) : l'utilisateur le lance lui-même
  dans Supabase → SQL Editor. Écrire le code pour qu'il fonctionne encore
  tant que le script n'a pas été lancé, quand c'est possible.

## Supabase (un seul projet, région eu-west-1)

- **Schéma `public`** : tables de l'appli bar, lues directement depuis le
  navigateur avec la clé publique, en temps réel. RLS **désactivé** sur ces
  tables (activer RLS sans politiques casserait l'appli).
  - `commandes` : id, table_name, serveur, items (json), statut
    (`envoyée` / `prête` / `terminée`), created_at, prete_le, soiree
  - `tables` : table_name, statut, nom_client, telephone, personnes, note
  - `paiements` : id, table_name, montant, mode (`cb` / `especes`), serveur,
    created_at, soiree
  - `ruptures` : nom (boissons en rupture)
  - `soirees` : id (= id de l'événement PILOT), nom, demarree_le
    (script : `supabase/soirees.sql`)
- **Schéma `pilot`** : tables de PILOT (Prisma), fermées aux clés publiques
  (`revoke` + RLS activé). Accès uniquement côté serveur via `DATABASE_URL`.
  Scripts : `pilot/supabase/tables.sql` (complet), `pilot/supabase/stocks.sql`.

## Lien entre les deux applis

- Dans PILOT, le bouton **« Caisse bar »** (liste des événements et page d'un
  événement) ouvre `https://app-commandes-bar.vercel.app/serveur?soiree=<id>&nom=<nom>`
  (`pilot/src/lib/caisse-bar.ts`, adresse réglable via `NEXT_PUBLIC_BAR_URL`).
- L'appli bar démarre alors automatiquement cette soirée sur **tous les
  appareils** (`app/_components/ChoixSoiree.tsx`) : tables remises à zéro,
  commandes et paiements filtrés sur la soirée (`parSoiree` dans
  `app/_lib/store.ts`). Les données des autres soirées restent en base.

## Appli bar (racine)

- Next.js 16 (lire `node_modules/next/dist/docs/` avant d'écrire du code),
  React 19, Tailwind v4 (couleurs dans `app/globals.css`), Zustand.
- État et accès Supabase : `app/_lib/store.ts` (mises à jour optimistes,
  temps réel + synchro toutes les 10 s dans `app/_components/Synchro.tsx`).
- Réglages : `app/_lib/config.ts` (nombre de tables, mots de passe, alertes).
  Carte des boissons : `app/_lib/carte.ts`.
- Profils : Serveur (prénom + mot de passe) et Bar (mot de passe), stockés
  dans le navigateur (`app/_lib/session.ts`).
- Paiement CB : app SumUp via « Payment Switch » (`app/_lib/sumup.ts`,
  retour sur `/sumup/retour`). Sur iPhone le retour s'ouvre dans Safari :
  l'appli retrouve le paiement grâce à `SuiviSumUp`.
- `/api/reveil` : appelé chaque jour par un cron Vercel pour que Supabase ne
  se mette pas en pause.
- Vérifications avant une PR : `npx tsc --noEmit`, `npx eslint app`,
  `npx next build` (avec `NEXT_PUBLIC_SUPABASE_URL` et
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` factices si besoin).
- `tsconfig.json`, ESLint et Tailwind ignorent le dossier `pilot/`.

## PILOT (`pilot/`)

Voir `pilot/CLAUDE.md`.
