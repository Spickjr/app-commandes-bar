import type { Boisson } from "./carte";
import type { ItemCommande } from "./store";

// Opérations sur la commande en préparation (avant envoi au bar).

export const ajouterAuPanier = (
  panier: ItemCommande[],
  boisson: Boisson
): ItemCommande[] => {
  const existe = panier.find((item) => item.nom === boisson.nom);

  if (existe) {
    return panier.map((item) =>
      item.nom === boisson.nom
        ? { ...item, quantite: item.quantite + 1 }
        : item
    );
  }

  return [...panier, { nom: boisson.nom, prix: boisson.prix, quantite: 1 }];
};

export const enleverUnDuPanier = (
  panier: ItemCommande[],
  nom: string
): ItemCommande[] =>
  panier
    .map((item) =>
      item.nom === nom ? { ...item, quantite: item.quantite - 1 } : item
    )
    .filter((item) => item.quantite > 0);

export const supprimerDuPanier = (
  panier: ItemCommande[],
  nom: string
): ItemCommande[] => panier.filter((item) => item.nom !== nom);
