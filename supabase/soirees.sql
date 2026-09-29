-- Soirées (une par événement PILOT) : commandes et paiements rattachés à leur soirée.
-- À exécuter une fois dans Supabase → SQL Editor.
create table if not exists soirees (
  id text primary key,
  nom text not null default '',
  demarree_le timestamptz not null default now()
);
alter table soirees disable row level security;
alter publication supabase_realtime add table soirees;

alter table commandes add column if not exists soiree text;
alter table paiements add column if not exists soiree text;
create index if not exists commandes_soiree_idx on commandes (soiree);
create index if not exists paiements_soiree_idx on paiements (soiree);
