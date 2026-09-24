"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type ItemCommande = {
  nom: string;
  prix: number;
  quantite: number;
};

export type InfosTable = {
  nom: string;
  telephone: string;
  personnes: number;
  note: string;
};

export type StatutCommande = "envoyée" | "prête" | "terminée";

export type Commande = {
  id: number;
  table: string;
  serveur: string;
  items: ItemCommande[];
  statut: StatutCommande;
};

// Lignes telles qu'elles sont stockées dans Supabase.
type LigneCommande = {
  id: number;
  table_name: string;
  serveur: string;
  items: ItemCommande[];
  statut: StatutCommande;
};

type LigneTable = {
  table_name: string;
  statut: string;
  nom_client: string | null;
  telephone: string | null;
  personnes: number | null;
  note: string | null;
};

type Store = {
  commandesBar: Commande[];
  historique: Commande[];

  statutsTables: Record<string, string>;
  infosTables: Record<string, InfosTable>;

  setStatutTable: (table: string, statut: string) => Promise<void>;
  setInfosTable: (table: string, infos: InfosTable) => Promise<void>;

  ajouterCommande: (
    table: string,
    serveur: string,
    items: ItemCommande[]
  ) => Promise<void>;

  chargerCommandes: () => Promise<void>;
  chargerTables: () => Promise<void>;

  marquerPrete: (id: number) => Promise<void>;
  terminerCommande: (id: number) => Promise<void>;

  supprimerHistorique: (id: number) => Promise<void>;
  viderHistorique: () => Promise<void>;
};

const INFOS_VIDES: InfosTable = {
  nom: "",
  telephone: "",
  personnes: 0,
  note: "",
};

// ---------- Lecture Supabase ----------

const lireCommandes = async () => {
  const { data } = await supabase
    .from("commandes")
    .select("*")
    .order("created_at", { ascending: true });

  if (!data) return null;

  const toutes: Commande[] = (data as LigneCommande[]).map((c) => ({
    id: c.id,
    table: c.table_name,
    serveur: c.serveur,
    items: c.items,
    statut: c.statut,
  }));

  return {
    commandesBar: toutes.filter((c) => c.statut !== "terminée"),
    historique: toutes.filter((c) => c.statut === "terminée"),
  };
};

const lireTables = async () => {
  const { data } = await supabase.from("tables").select("*");

  if (!data) return null;

  const statutsTables: Record<string, string> = {};
  const infosTables: Record<string, InfosTable> = {};

  (data as LigneTable[]).forEach((table) => {
    statutsTables[table.table_name] = table.statut;

    infosTables[table.table_name] = {
      nom: table.nom_client || "",
      telephone: table.telephone || "",
      personnes: table.personnes || 0,
      note: table.note || "",
    };
  });

  return { statutsTables, infosTables };
};

// ---------- Écriture Supabase ----------

// Met à jour la ligne de la table si elle existe, sinon la crée.
// Un seul aller-retour Supabase dans le cas courant (la table existe déjà).
const enregistrerTable = async (
  table: string,
  modifications: Partial<LigneTable>,
  statut: string,
  infos: InfosTable
) => {
  const { data, error } = await supabase
    .from("tables")
    .update(modifications)
    .eq("table_name", table)
    .select("table_name");

  if (error || (data && data.length > 0)) return;

  await supabase.from("tables").insert({
    table_name: table,
    statut,
    nom_client: infos.nom,
    telephone: infos.telephone,
    personnes: infos.personnes,
    note: infos.note,
    ...modifications,
  });
};

// ---------- Temps réel ----------

// Un seul abonnement par table Supabase, même si on change de page plusieurs fois.
let canalCommandes: RealtimeChannel | null = null;
let canalTables: RealtimeChannel | null = null;

// Plusieurs changements rapprochés (ex : commande + statut de table)
// ne déclenchent qu'un seul rechargement.
const DELAI_RECHARGEMENT_MS = 150;

const ecouter = (nomCanal: string, tableSupabase: string, recharger: () => void) => {
  let minuteur: ReturnType<typeof setTimeout> | undefined;

  return supabase
    .channel(nomCanal)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableSupabase },
      () => {
        clearTimeout(minuteur);
        minuteur = setTimeout(recharger, DELAI_RECHARGEMENT_MS);
      }
    )
    .subscribe();
};

// ---------- Store ----------

export const useCommandeStore = create<Store>()(
  persist(
    (set, get) => ({
      commandesBar: [],
      historique: [],
      statutsTables: {},
      infosTables: {},

      setStatutTable: async (table, statut) => {
        const infos = get().infosTables[table] || INFOS_VIDES;

        set((state) => ({
          statutsTables: { ...state.statutsTables, [table]: statut },
        }));

        await enregistrerTable(table, { statut }, statut, infos);
      },

      setInfosTable: async (table, infos) => {
        const statut = get().statutsTables[table] || "occupée";

        set((state) => ({
          infosTables: { ...state.infosTables, [table]: infos },
        }));

        await enregistrerTable(
          table,
          {
            nom_client: infos.nom,
            telephone: infos.telephone,
            personnes: infos.personnes,
            note: infos.note,
          },
          statut,
          infos
        );
      },

      chargerTables: async () => {
        const recharger = async () => {
          const tables = await lireTables();
          if (tables) set(tables);
        };

        await recharger();

        if (!canalTables) {
          canalTables = ecouter("tables-live", "tables", recharger);
        }
      },

      chargerCommandes: async () => {
        const recharger = async () => {
          const commandes = await lireCommandes();
          if (commandes) set(commandes);
        };

        await recharger();

        if (!canalCommandes) {
          canalCommandes = ecouter("commandes-live", "commandes", recharger);
        }
      },

      ajouterCommande: async (table, serveur, items) => {
        await Promise.all([
          supabase.from("commandes").insert({
            table_name: table,
            serveur,
            statut: "envoyée",
            items,
          }),
          get().setStatutTable(table, "commande"),
        ]);
      },

      marquerPrete: async (id) => {
        const commande = get().commandesBar.find((c) => c.id === id);
        if (!commande) return;

        set((state) => ({
          commandesBar: state.commandesBar.map((c) =>
            c.id === id ? { ...c, statut: "prête" } : c
          ),
        }));

        await Promise.all([
          supabase.from("commandes").update({ statut: "prête" }).eq("id", id),
          get().setStatutTable(commande.table, "prete"),
        ]);
      },

      terminerCommande: async (id) => {
        const commande = get().commandesBar.find((c) => c.id === id);
        if (!commande) return;

        set((state) => ({
          commandesBar: state.commandesBar.filter((c) => c.id !== id),
          historique: [...state.historique, { ...commande, statut: "terminée" }],
        }));

        await Promise.all([
          supabase.from("commandes").update({ statut: "terminée" }).eq("id", id),
          get().setStatutTable(commande.table, "occupée"),
        ]);
      },

      supprimerHistorique: async (id) => {
        set((state) => ({
          historique: state.historique.filter((c) => c.id !== id),
        }));

        await supabase.from("commandes").delete().eq("id", id);
      },

      viderHistorique: async () => {
        set({ historique: [] });

        await supabase.from("commandes").delete().eq("statut", "terminée");
      },
    }),
    {
      name: "commandes-bar",
    }
  )
);
