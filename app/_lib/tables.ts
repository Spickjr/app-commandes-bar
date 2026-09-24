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
