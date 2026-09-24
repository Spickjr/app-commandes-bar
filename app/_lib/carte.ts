// Carte des boissons.
// Pour ajouter / modifier une boisson ou un prix, c'est uniquement ici.
// Astuce : un "\n" dans le nom affiche la suite en dessous, plus petit et en italique
// (ex : le type de champagne).

export type Boisson = {
  nom: string;
  prix: number;
};

export const CARTE = {
  Bières: [
    { nom: "Pichet de Bières", prix: 15 },
    { nom: "Bière", prix: 3 },
    { nom: "Bière Fraise", prix: 3 },
    { nom: "Bière pêche", prix: 3 },
    { nom: "Despérados", prix: 5 },
    { nom: "Bud", prix: 4 },
    { nom: "Seau de despé (6 cannettes)", prix: 25 },
    { nom: "Seau de Bud (6 cannettes)", prix: 20 },
  ],

  Softs: [
    { nom: "Cannette de Coca", prix: 2 },
    { nom: "Cannette d'Ice Tea", prix: 2 },
    { nom: "Cannette de Perrier", prix: 2 },
    { nom: "Bouteille d'Eau", prix: 2 },
  ],

  Spiritueux: [
    { nom: "Verre de Get 27", prix: 4 },
    { nom: "Bouteille de Get 27", prix: 40 },
    { nom: "Bouteille de Bailey", prix: 40 },
  ],

  Champagne: [
    { nom: 'Bouteille de Ruinard\n"Blanc de Blancs"', prix: 150 },
    { nom: 'Bouteille de Ruinard\n"Brut"', prix: 100 },
    { nom: 'Bouteille de Deutz\n"Brut"', prix: 80 },
  ],

  Vin: [
    { nom: "Verre de vin blanc", prix: 4 },
    { nom: "Bouteille de vin blanc", prix: 35 },
  ],

  Cocktails: [
    { nom: "Verre de mojito", prix: 8 },
    { nom: "Pichet de mojito", prix: 70 },
    { nom: "Verre de Moscow Mule", prix: 8 },
    { nom: "Pichet de Moscow Mule", prix: 70 },
    { nom: "Verre de spritz", prix: 8 },
    { nom: "Pichet de Spritz", prix: 70 },
  ],
} satisfies Record<string, Boisson[]>;

export type Categorie = keyof typeof CARTE;

export const CATEGORIES = Object.keys(CARTE) as Categorie[];

// Nom affiché sur une seule ligne (panier, bar, dashboard).
export const nomSurUneLigne = (nom: string) => nom.replace(/\n/g, " ");
