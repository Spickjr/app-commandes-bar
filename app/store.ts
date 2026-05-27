"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
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

export type Commande = {
  id: number;
  table: string;
  serveur: string;
  items: ItemCommande[];
  statut: "envoyée" | "prête" | "terminée";
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

const convertirCommandes = (data: any[]): Commande[] => {
  return data.map((c) => ({
    id: c.id,
    table: c.table_name,
    serveur: c.serveur,
    items: c.items,
    statut: c.statut,
  }));
};

export const useCommandeStore = create<Store>()(
  persist(
    (set, get) => ({
      commandesBar: [],
      historique: [],
      statutsTables: {},
      infosTables: {},

      setStatutTable: async (table, statut) => {
        const infos = get().infosTables[table] || {
          nom: "",
          telephone: "",
          personnes: 0,
          note: "",
        };

        const { data } = await supabase
          .from("tables")
          .select("*")
          .eq("table_name", table)
          .single();

        if (data) {
          await supabase
            .from("tables")
            .update({
              statut,
            })
            .eq("table_name", table);
        } else {
          await supabase.from("tables").insert({
            table_name: table,
            statut,
            nom_client: infos.nom,
            telephone: infos.telephone,
            personnes: infos.personnes,
            note: infos.note,
          });
        }

        set((state) => ({
          statutsTables: {
            ...state.statutsTables,
            [table]: statut,
          },
        }));
      },

      setInfosTable: async (table, infos) => {
        const statut = get().statutsTables[table] || "occupée";

        const { data } = await supabase
          .from("tables")
          .select("*")
          .eq("table_name", table)
          .single();

        if (data) {
          await supabase
            .from("tables")
            .update({
              nom_client: infos.nom,
              telephone: infos.telephone,
              personnes: infos.personnes,
              note: infos.note,
            })
            .eq("table_name", table);
        } else {
          await supabase.from("tables").insert({
            table_name: table,
            statut,
            nom_client: infos.nom,
            telephone: infos.telephone,
            personnes: infos.personnes,
            note: infos.note,
          });
        }

        set((state) => ({
          infosTables: {
            ...state.infosTables,
            [table]: infos,
          },
        }));
      },

      chargerTables: async () => {
        const { data } = await supabase.from("tables").select("*");

        if (data) {
          const statuts: Record<string, string> = {};
          const infos: Record<string, InfosTable> = {};

          data.forEach((table) => {
            statuts[table.table_name] = table.statut;

            infos[table.table_name] = {
              nom: table.nom_client || "",
              telephone: table.telephone || "",
              personnes: table.personnes || 0,
              note: table.note || "",
            };
          });

          set({
            statutsTables: statuts,
            infosTables: infos,
          });
        }

        supabase
          .channel("tables-live")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "tables",
            },
            async () => {
              const { data } = await supabase
                .from("tables")
                .select("*");

              if (!data) return;

              const statuts: Record<string, string> = {};
              const infos: Record<string, InfosTable> = {};

              data.forEach((table) => {
                statuts[table.table_name] = table.statut;

                infos[table.table_name] = {
                  nom: table.nom_client || "",
                  telephone: table.telephone || "",
                  personnes: table.personnes || 0,
                  note: table.note || "",
                };
              });

              set({
                statutsTables: statuts,
                infosTables: infos,
              });
            }
          )
          .subscribe();
      },

      ajouterCommande: async (table, serveur, items) => {
        await supabase.from("commandes").insert({
          table_name: table,
          serveur,
          statut: "envoyée",
          items,
        });

        await get().setStatutTable(table, "commande");
      },

      chargerCommandes: async () => {
        const { data } = await supabase
          .from("commandes")
          .select("*")
          .order("created_at", { ascending: true });

        if (data) {
          const toutes = convertirCommandes(data);

          set({
            commandesBar: toutes.filter(
              (c) => c.statut !== "terminée"
            ),

            historique: toutes.filter(
              (c) => c.statut === "terminée"
            ),
          });
        }

        supabase
          .channel("commandes-live")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "commandes",
            },
            async () => {
              const { data } = await supabase
                .from("commandes")
                .select("*")
                .order("created_at", {
                  ascending: true,
                });

              if (!data) return;

              const toutes = convertirCommandes(data);

              set({
                commandesBar: toutes.filter(
                  (c) => c.statut !== "terminée"
                ),

                historique: toutes.filter(
                  (c) => c.statut === "terminée"
                ),
              });
            }
          )
          .subscribe();
      },

      marquerPrete: async (id) => {
        const commande = get().commandesBar.find(
          (c) => c.id === id
        );

        if (!commande) return;

        await supabase
          .from("commandes")
          .update({
            statut: "prête",
          })
          .eq("id", id);

        await get().setStatutTable(
          commande.table,
          "prete"
        );
      },

      terminerCommande: async (id) => {
        const commande = get().commandesBar.find(
          (c) => c.id === id
        );

        if (!commande) return;

        await supabase
          .from("commandes")
          .update({
            statut: "terminée",
          })
          .eq("id", id);

        await get().setStatutTable(
          commande.table,
          "occupée"
        );
      },

      supprimerHistorique: async (id) => {
        await supabase
          .from("commandes")
          .delete()
          .eq("id", id);

        set((state) => ({
          historique: state.historique.filter(
            (c) => c.id !== id
          ),
        }));
      },

      viderHistorique: async () => {
        await supabase
          .from("commandes")
          .delete()
          .eq("statut", "terminée");

        set({
          historique: [],
        });
      },
    }),
    {
      name: "commandes-bar",
    }
  )
);