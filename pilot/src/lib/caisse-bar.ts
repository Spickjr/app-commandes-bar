// Lien vers l'appli « Commandes Bar » (caisse de la soirée) pour un événement.
// L'appli bar lit `soiree` (identifiant de l'événement) et `nom` dans l'adresse.
const URL_CAISSE_BAR =
  process.env.NEXT_PUBLIC_BAR_URL || "https://app-commandes-bar.vercel.app";

export function lienCaisseBar(event: { id: string; name: string }) {
  const url = new URL("/serveur", URL_CAISSE_BAR);
  url.searchParams.set("soiree", event.id);
  url.searchParams.set("nom", event.name);
  return url.toString();
}
