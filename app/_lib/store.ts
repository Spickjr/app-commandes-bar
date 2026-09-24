"use client";

import { create } from "zustand";
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

export type ModePaiement = "cb" | "especes";

export type Paiement = {
  id: number;
  table: string;
  montant: number;
  mode: ModePaiement;
  serveur: string;
  creeLe: string;
};

export type Commande = {
  id: number;
  table: string;
  serveur: string;
  items: ItemCommande[];
  statut: StatutCommande;
  // Date d'envoi au bar (ISO), pour le chrono d'attente.
  creeLe: string;
};

// Lignes telles qu'elles sont stockées dans Supabase.
type LigneCommande = {
  id: number;
  table_name: string;
  serveur: string;
  items: ItemCommande[];
  statut: StatutCommande;
  created_at: string;
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
  // false quand la dernière lecture Supabase a échoué (bandeau d'alerte).
  connexionOk: boolean;

  // Boissons en rupture (noms de la carte), partagées entre appareils.
  ruptures: string[];
  // false tant que la table "ruptures" n'existe pas dans Supabase.
  rupturesDisponibles: boolean;
  // Renvoie false si Supabase a refusé l'enregistrement.
  basculerRupture: (nom: string) => Promise<boolean>;

  // Paiements enregistrés (CB SumUp / espèces), partagés entre appareils.
  paiements: Paiement[];
  // false tant que la table "paiements" n'existe pas dans Supabase.
  paiementsDisponibles: boolean;
  // Renvoient false si Supabase a refusé l'enregistrement.
  encaisser: (
    table: string,
    montant: number,
    mode: ModePaiement,
    serveur: string
  ) => Promise<boolean>;
  annulerPaiement: (id: number) => Promise<boolean>;

  commandesBar: Commande[];
  historique: Commande[];

  statutsTables: Record<string, string>;
  infosTables: Record<string, InfosTable>;

  setStatutTable: (table: string, statut: string) => Promise<void>;
  setInfosTable: (table: string, infos: InfosTable) => Promise<void>;

  // Lève une erreur si la commande n'a pas pu être enregistrée.
  ajouterCommande: (
    table: string,
    serveur: string,
    items: ItemCommande[]
  ) => Promise<void>;

  // Commandes en cours + historique (Dashboard).
  chargerCommandes: () => Promise<void>;
  chargerTables: () => Promise<void>;
  // Rafraîchissement léger : tables + commandes en cours.
  synchroniser: () => Promise<void>;

  // Déplace le client (infos, statut, toutes ses commandes) vers une table libre.
  transfererTable: (source: string, destination: string) => Promise<void>;

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

const versCommande = (c: LigneCommande): Commande => ({
  id: c.id,
  table: c.table_name,
  serveur: c.serveur,
  items: c.items,
  statut: c.statut,
  creeLe: c.created_at,
});

const lireToutesCommandes = async () => {
  const { data } = await supabase
    .from("commandes")
    .select("*")
    .order("created_at", { ascending: true });

  if (!data) return null;

  const toutes = (data as LigneCommande[]).map(versCommande);

  return {
    commandesBar: toutes.filter((c) => c.statut !== "terminée"),
    historique: toutes.filter((c) => c.statut === "terminée"),
  };
};

// Seulement les commandes en cours : léger, utilisé pour les rafraîchissements.
const lireCommandesEnCours = async () => {
  const { data } = await supabase
    .from("commandes")
    .select("*")
    .neq("statut", "terminée")
    .order("created_at", { ascending: true });

  if (!data) return null;

  return { commandesBar: (data as LigneCommande[]).map(versCommande) };
};

// Codes renvoyés quand la table n'existe pas (pas encore créée dans Supabase).
const TABLE_ABSENTE = ["PGRST205", "42P01"];

const lireRuptures = async () => {
  const { data, error } = await supabase.from("ruptures").select("nom");

  if (error) {
    return TABLE_ABSENTE.includes(error.code)
      ? { ruptures: [], rupturesDisponibles: false }
      : null;
  }

  return {
    ruptures: (data as { nom: string }[]).map((r) => r.nom),
    rupturesDisponibles: true,
  };
};

type LignePaiement = {
  id: number;
  table_name: string;
  montant: number | string;
  mode: ModePaiement;
  serveur: string | null;
  created_at: string;
};

const versPaiement = (p: LignePaiement): Paiement => ({
  id: p.id,
  table: p.table_name,
  montant: Number(p.montant),
  mode: p.mode,
  serveur: p.serveur || "",
  creeLe: p.created_at,
});

const lirePaiements = async () => {
  const { data, error } = await supabase
    .from("paiements")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return TABLE_ABSENTE.includes(error.code)
      ? { paiements: [], paiementsDisponibles: false }
      : null;
  }

  return {
    paiements: (data as LignePaiement[]).map(versPaiement),
    paiementsDisponibles: true,
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
// Renvoie false si l'enregistrement a échoué.
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

  if (error) return false;
  if (data && data.length > 0) return true;

  const { error: erreurInsert } = await supabase.from("tables").insert({
    table_name: table,
    statut,
    nom_client: infos.nom,
    telephone: infos.telephone,
    personnes: infos.personnes,
    note: infos.note,
    ...modifications,
  });

  return !erreurInsert;
};

// ---------- Temps réel ----------

// Un seul abonnement par table Supabase, même si on change de page plusieurs fois.
let canalCommandes: RealtimeChannel | null = null;
let canalTables: RealtimeChannel | null = null;
let canalRuptures: RealtimeChannel | null = null;
let canalPaiements: RealtimeChannel | null = null;

// Plusieurs changements rapprochés (ex : commande + statut de table)
// ne déclenchent qu'un seul rechargement.
const DELAI_RECHARGEMENT_MS = 150;

// Écoute les changements d'une table Supabase. À chaque (re)connexion, on
// recharge pour rattraper ce qui a été manqué (téléphone en veille, réseau
// coupé…). Si la connexion est perdue, `surPerte` permet de la recréer plus tard.
const ecouter = (
  nomCanal: string,
  tableSupabase: string,
  recharger: () => void,
  surPerte: () => void
) => {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  let perdu = false;

  const canal = supabase
    .channel(nomCanal)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tableSupabase },
      () => {
        clearTimeout(minuteur);
        minuteur = setTimeout(recharger, DELAI_RECHARGEMENT_MS);
      }
    )
    .subscribe((statut) => {
      if (statut === "SUBSCRIBED") {
        recharger();
        return;
      }

      if (
        !perdu &&
        (statut === "CHANNEL_ERROR" ||
          statut === "TIMED_OUT" ||
          statut === "CLOSED")
      ) {
        perdu = true;
        surPerte();
        supabase.removeChannel(canal);
      }
    });

  return canal;
};

// ---------- Store ----------

// Pas de sauvegarde locale des données : chaque appareil affiche toujours
// ce qui est dans Supabase (une copie locale pouvait devenir périmée).
export const useCommandeStore = create<Store>()((set, get) => {
  const rechargerTables = async () => {
    const tables = await lireTables();
    set(tables ? { ...tables, connexionOk: true } : { connexionOk: false });
  };

  const rechargerToutesCommandes = async () => {
    const commandes = await lireToutesCommandes();
    set(commandes ? { ...commandes, connexionOk: true } : { connexionOk: false });
  };

  const rechargerCommandesEnCours = async () => {
    const commandes = await lireCommandesEnCours();
    set(commandes ? { ...commandes, connexionOk: true } : { connexionOk: false });
  };

  const rechargerRuptures = async () => {
    const ruptures = await lireRuptures();
    if (ruptures) set(ruptures);
  };

  const rechargerPaiements = async () => {
    const paiements = await lirePaiements();
    if (paiements) set(paiements);
  };

  // (Re)crée les abonnements temps réel s'ils n'existent pas ou ont été perdus.
  const assurerTempsReel = () => {
    if (!canalPaiements && get().paiementsDisponibles) {
      canalPaiements = ecouter(
        "paiements-live",
        "paiements",
        rechargerPaiements,
        () => {
          canalPaiements = null;
        }
      );
    }

    if (!canalRuptures && get().rupturesDisponibles) {
      canalRuptures = ecouter("ruptures-live", "ruptures", rechargerRuptures, () => {
        canalRuptures = null;
      });
    }

    if (!canalTables) {
      canalTables = ecouter("tables-live", "tables", rechargerTables, () => {
        canalTables = null;
      });
    }

    if (!canalCommandes) {
      canalCommandes = ecouter(
        "commandes-live",
        "commandes",
        rechargerToutesCommandes,
        () => {
          canalCommandes = null;
        }
      );
    }
  };

  return {
    connexionOk: true,
    ruptures: [],
    // Confirmé à la première lecture (évite de s'abonner à une table absente).
    rupturesDisponibles: false,

    basculerRupture: async (nom) => {
      const enRupture = get().ruptures.includes(nom);

      set((state) => ({
        ruptures: enRupture
          ? state.ruptures.filter((r) => r !== nom)
          : [...state.ruptures, nom],
      }));

      const { error } = enRupture
        ? await supabase.from("ruptures").delete().eq("nom", nom)
        : await supabase.from("ruptures").insert({ nom });

      if (error) {
        await rechargerRuptures();
        return false;
      }

      return true;
    },

    commandesBar: [],
    historique: [],
    statutsTables: {},
    infosTables: {},

    setStatutTable: async (table, statut) => {
      const infos = get().infosTables[table] || INFOS_VIDES;

      // Affichage immédiat, puis Supabase. En cas d'échec, on revient
      // à l'état réel pour ne pas afficher quelque chose de faux.
      set((state) => ({
        statutsTables: { ...state.statutsTables, [table]: statut },
      }));

      const ok = await enregistrerTable(table, { statut }, statut, infos);
      if (!ok) await rechargerTables();
    },

    setInfosTable: async (table, infos) => {
      const statut = get().statutsTables[table] || "occupée";

      set((state) => ({
        infosTables: { ...state.infosTables, [table]: infos },
      }));

      const ok = await enregistrerTable(
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

      if (!ok) await rechargerTables();
    },

    chargerTables: async () => {
      assurerTempsReel();
      await rechargerTables();
    },

    chargerCommandes: async () => {
      assurerTempsReel();
      await rechargerToutesCommandes();
    },

    synchroniser: async () => {
      await Promise.all([
        rechargerTables(),
        rechargerCommandesEnCours(),
        rechargerRuptures(),
        rechargerPaiements(),
      ]);
      assurerTempsReel();
    },

    ajouterCommande: async (table, serveur, items) => {
      const [{ error }] = await Promise.all([
        supabase.from("commandes").insert({
          table_name: table,
          serveur,
          statut: "envoyée",
          items,
        }),
        get().setStatutTable(table, "commande"),
      ]);

      if (error) {
        await rechargerTables();
        throw new Error(error.message);
      }

      await rechargerCommandesEnCours();
    },

    paiements: [],
    // Confirmé à la première lecture (évite de s'abonner à une table absente).
    paiementsDisponibles: false,

    encaisser: async (table, montant, mode, serveur) => {
      // Identifiant provisoire (négatif) jusqu'au rechargement depuis Supabase.
      const provisoire: Paiement = {
        id: -Date.now(),
        table,
        montant,
        mode,
        serveur,
        creeLe: new Date().toISOString(),
      };

      set((state) => ({ paiements: [...state.paiements, provisoire] }));

      const { error } = await supabase
        .from("paiements")
        .insert({ table_name: table, montant, mode, serveur });

      await rechargerPaiements();
      return !error;
    },

    annulerPaiement: async (id) => {
      set((state) => ({
        paiements: state.paiements.filter((p) => p.id !== id),
      }));

      const { error } = await supabase.from("paiements").delete().eq("id", id);

      if (error) {
        await rechargerPaiements();
        return false;
      }

      return true;
    },

    transfererTable: async (source, destination) => {
      const { statutsTables, infosTables } = get();
      const infos = infosTables[source] || INFOS_VIDES;
      const statut =
        statutsTables[source] && statutsTables[source] !== "libre"
          ? statutsTables[source]
          : "occupée";

      set((state) => ({
        statutsTables: {
          ...state.statutsTables,
          [destination]: statut,
          [source]: "libre",
        },
        infosTables: {
          ...state.infosTables,
          [destination]: infos,
          [source]: INFOS_VIDES,
        },
        commandesBar: state.commandesBar.map((c) =>
          c.table === source ? { ...c, table: destination } : c
        ),
        historique: state.historique.map((c) =>
          c.table === source ? { ...c, table: destination } : c
        ),
        paiements: state.paiements.map((p) =>
          p.table === source ? { ...p, table: destination } : p
        ),
      }));

      const [okDestination, okSource, { error }, resultatPaiements] = await Promise.all([
        enregistrerTable(
          destination,
          {
            statut,
            nom_client: infos.nom,
            telephone: infos.telephone,
            personnes: infos.personnes,
            note: infos.note,
          },
          statut,
          infos
        ),
        enregistrerTable(
          source,
          {
            statut: "libre",
            nom_client: "",
            telephone: "",
            personnes: 0,
            note: "",
          },
          "libre",
          INFOS_VIDES
        ),
        // Toutes les commandes (en cours et historique) suivent le client,
        // pour que son total reste sur sa nouvelle table.
        supabase
          .from("commandes")
          .update({ table_name: destination })
          .eq("table_name", source),
        // Les paiements déjà faits suivent aussi, pour garder le bon reste à payer.
        get().paiementsDisponibles
          ? supabase
              .from("paiements")
              .update({ table_name: destination })
              .eq("table_name", source)
          : Promise.resolve({ error: null }),
      ]);

      if (!okDestination || !okSource || error || resultatPaiements.error) {
        await Promise.all([
          rechargerTables(),
          rechargerToutesCommandes(),
          rechargerPaiements(),
        ]);
        throw new Error("Transfert incomplet");
      }
    },

    marquerPrete: async (id) => {
      const commande = get().commandesBar.find((c) => c.id === id);
      if (!commande) return;

      set((state) => ({
        commandesBar: state.commandesBar.map((c) =>
          c.id === id ? { ...c, statut: "prête" } : c
        ),
      }));

      const [{ error }] = await Promise.all([
        supabase.from("commandes").update({ statut: "prête" }).eq("id", id),
        get().setStatutTable(commande.table, "prete"),
      ]);

      if (error) await rechargerToutesCommandes();
    },

    terminerCommande: async (id) => {
      const commande = get().commandesBar.find((c) => c.id === id);
      if (!commande) return;

      set((state) => ({
        commandesBar: state.commandesBar.filter((c) => c.id !== id),
        historique: [...state.historique, { ...commande, statut: "terminée" }],
      }));

      const [{ error }] = await Promise.all([
        supabase.from("commandes").update({ statut: "terminée" }).eq("id", id),
        get().setStatutTable(commande.table, "occupée"),
      ]);

      if (error) await rechargerToutesCommandes();
    },

    supprimerHistorique: async (id) => {
      set((state) => ({
        historique: state.historique.filter((c) => c.id !== id),
      }));

      const { error } = await supabase.from("commandes").delete().eq("id", id);
      if (error) await rechargerToutesCommandes();
    },

    // Fin de soirée : efface les commandes terminées et tous les paiements.
    viderHistorique: async () => {
      set({ historique: [], paiements: [] });

      const [{ error }, resultatPaiements] = await Promise.all([
        supabase.from("commandes").delete().eq("statut", "terminée"),
        get().paiementsDisponibles
          ? supabase.from("paiements").delete().gte("id", 0)
          : Promise.resolve({ error: null }),
      ]);

      if (error) await rechargerToutesCommandes();
      if (resultatPaiements.error) await rechargerPaiements();
    },
  };
});
