// Réglages généraux de l'application.

export const NOMBRE_TABLES = 40;

// Mot de passe commun demandé à la connexion serveur.
export const MOT_DE_PASSE_APP = "13630";

export const NUMEROS_TABLES = Array.from(
  { length: NOMBRE_TABLES },
  (_, i) => i + 1
);

// Nom utilisé dans Supabase pour identifier une table ("Table 12").
export const nomTable = (numero: number | string) => `Table ${numero}`;
