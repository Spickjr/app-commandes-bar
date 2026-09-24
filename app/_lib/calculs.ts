import type { Commande, ItemCommande } from "./store";

export type VenteBoisson = {
  nom: string;
  quantite: number;
  total: number;
};

export const totalItems = (items: { prix: number; quantite: number }[]) =>
  items.reduce((total, item) => total + item.prix * item.quantite, 0);

export const nombreArticles = (items: ItemCommande[]) =>
  items.reduce((total, item) => total + item.quantite, 0);

// Chiffres de la soirée à partir des commandes terminées.
export const statistiquesSoiree = (historique: Commande[]) => {
  const ventes: Record<string, VenteBoisson> = {};

  historique.forEach((commande) => {
    commande.items.forEach((item) => {
      if (!ventes[item.nom]) {
        ventes[item.nom] = { nom: item.nom, quantite: 0, total: 0 };
      }

      ventes[item.nom].quantite += item.quantite;
      ventes[item.nom].total += item.prix * item.quantite;
    });
  });

  return {
    totalSoiree: historique.reduce(
      (total, commande) => total + totalItems(commande.items),
      0
    ),
    nombreCommandes: historique.length,
    totalBoissons: historique.reduce(
      (total, commande) => total + nombreArticles(commande.items),
      0
    ),
    // Classées de la plus vendue à la moins vendue.
    ventesParBoisson: Object.values(ventes).sort(
      (a, b) => b.quantite - a.quantite
    ),
  };
};

export type StatistiquesSoiree = ReturnType<typeof statistiquesSoiree>;

export const grouperParTable = (commandes: Commande[]) =>
  commandes.reduce((groupes, commande) => {
    if (!groupes[commande.table]) {
      groupes[commande.table] = [];
    }

    groupes[commande.table].push(commande);
    return groupes;
  }, {} as Record<string, Commande[]>);
