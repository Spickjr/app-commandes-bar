// Montants en euros : arrondis au centime et affichés à la française.

export const arrondir = (montant: number) => Math.round(montant * 100) / 100;

// 12 → "12 €", 12.5 → "12,50 €"
export const formatEuros = (montant: number) =>
  `${arrondir(montant).toLocaleString("fr-FR", {
    minimumFractionDigits: Number.isInteger(arrondir(montant)) ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`;

// "12,5" ou "12.50" → 12.5 ; NaN si la saisie n'est pas un nombre.
export const lireMontant = (saisie: string) =>
  arrondir(Number(saisie.replace(",", ".").replace(/\s/g, "")));
