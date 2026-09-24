import type { Commande, ItemCommande, Paiement } from "./store";
import { arrondir } from "./argent";

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

// Addition en cours d'une table. Elle repart de zéro à chaque fois que
// l'addition précédente a été entièrement payée : seules les commandes
// pas encore réglées (et les paiements qui s'y rapportent) sont comptées.
export const additionTable = (
  table: string,
  commandes: Commande[],
  paiements: Paiement[]
) => {
  const evenements = [
    ...commandes
      .filter((c) => c.table === table)
      .map((c) => ({ date: c.creeLe, montant: totalItems(c.items), paiement: null })),
    ...paiements
      .filter((p) => p.table === table)
      .map((p) => ({ date: p.creeLe, montant: p.montant, paiement: p })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let total = 0;
  let paye = 0;
  let paiementsEnCours: Paiement[] = [];

  evenements.forEach((e) => {
    if (e.paiement) {
      paye = arrondir(paye + e.montant);
      paiementsEnCours.push(e.paiement);
    } else {
      total = arrondir(total + e.montant);
    }

    // Addition soldée : on repart de zéro pour les prochaines commandes.
    if (total > 0 && paye >= total) {
      total = 0;
      paye = 0;
      paiementsEnCours = [];
    }
  });

  return {
    total,
    paye,
    reste: Math.max(0, arrondir(total - paye)),
    paiementsEnCours,
  };
};

// Encaissements de la soirée, pour le Dashboard et le rapport.
export const statistiquesEncaissement = (
  commandes: Commande[],
  paiements: Paiement[]
) => {
  const tables = new Set([
    ...commandes.map((c) => c.table),
    ...paiements.map((p) => p.table),
  ]);

  const somme = (mode: Paiement["mode"]) =>
    arrondir(
      paiements
        .filter((p) => p.mode === mode)
        .reduce((total, p) => total + p.montant, 0)
    );

  return {
    cb: somme("cb"),
    especes: somme("especes"),
    resteDu: arrondir(
      [...tables].reduce(
        (total, table) => total + additionTable(table, commandes, paiements).reste,
        0
      )
    ),
  };
};

export type StatistiquesEncaissement = ReturnType<typeof statistiquesEncaissement>;
