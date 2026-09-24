// Paiement par l'app SumUp (« Payment Switch ») : l'app SumUp s'ouvre avec le
// montant, le client paie (Tap to Pay ou terminal), puis SumUp revient sur
// /sumup/retour qui enregistre le paiement CB.
//
// Réglages (Vercel → Settings → Environment Variables) :
// - NEXT_PUBLIC_SUMUP_AFFILIATE_KEY : clé affilié créée sur me.sumup.com → Developers
// - NEXT_PUBLIC_SUMUP_APP_ID (facultatif) : identifiant d'app associé à la clé
// Sans clé, le bouton « Payer avec SumUp » n'apparaît pas.

const CLE = process.env.NEXT_PUBLIC_SUMUP_AFFILIATE_KEY || "";
const APP_ID = process.env.NEXT_PUBLIC_SUMUP_APP_ID || "";

export const sumupActif = CLE !== "";

export const lienPaiementSumUp = ({
  table,
  montant,
  serveur,
}: {
  table: string;
  montant: number;
  serveur: string;
}) => {
  // Identifiant unique : évite d'enregistrer deux fois le même paiement au retour.
  const reference = `oc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const retour = new URL("/sumup/retour", window.location.origin);
  retour.searchParams.set("table", table);
  retour.searchParams.set("montant", montant.toFixed(2));
  retour.searchParams.set("serveur", serveur);
  retour.searchParams.set("ref", reference);

  const parametres = new URLSearchParams({
    amount: montant.toFixed(2),
    currency: "EUR",
    "affiliate-key": CLE,
    title: `Of Course ! · ${table}`,
    "foreign-tx-id": reference,
    callbacksuccess: retour.toString(),
    callbackfail: retour.toString(),
  });

  if (APP_ID) parametres.set("app-id", APP_ID);

  return `sumupmerchant://pay/1.0?${parametres.toString()}`;
};
