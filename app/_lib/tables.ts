import type { Commande } from "./store";

// État affiché d'une table : combine son statut Supabase et sa commande en cours.
export type EtatTable = "libre" | "occupee" | "commande" | "prete";

export const etatTable = (
  statut: string | undefined,
  commandeEnCours: Commande | undefined
): EtatTable => {
  if (commandeEnCours?.statut === "prête") return "prete";
  if (commandeEnCours?.statut === "envoyée") return "commande";

  if (statut === "prete") return "prete";
  if (statut === "commande") return "commande";
  if (statut === "occupée") return "occupee";

  return "libre";
};

// Libellés et couleurs de chaque état.
export const STYLE_ETAT: Record<
  EtatTable,
  { label: string; fond: string; pastille: string; point: string; bord: string }
> = {
  libre: {
    label: "Libre",
    fond: "bg-carte",
    pastille: "text-doux",
    point: "bg-[#5e5e67]",
    bord: "border-transparent",
  },
  occupee: {
    label: "Occupée",
    fond: "bg-bleu-fond",
    pastille: "text-bleu bg-bleu/15",
    point: "bg-bleu",
    bord: "border-bleu-bord",
  },
  commande: {
    label: "Commande",
    fond: "bg-ambre-fond",
    pastille: "text-ambre bg-ambre/15",
    point: "bg-ambre",
    bord: "border-ambre-bord",
  },
  prete: {
    label: "Prête",
    fond: "bg-sauge-fond",
    pastille: "text-sauge bg-sauge/15",
    point: "bg-sauge",
    bord: "border-sauge-bord",
  },
};
