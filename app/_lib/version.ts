// Version du code chargé sur cet appareil (fournie par Vercel au moment du build).
export const VERSION_APP = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "";

// Recharge l'app si une nouvelle version a été mise en ligne depuis.
export const verifierMiseAJour = async () => {
  if (!VERSION_APP) return;

  try {
    const reponse = await fetch("/api/version", { cache: "no-store" });
    const { version } = (await reponse.json()) as { version: string | null };

    if (!version || version === VERSION_APP) return;

    // Une seule tentative par nouvelle version, pour éviter une boucle de
    // rechargements si le navigateur resservait l'ancienne version.
    const cle = "rechargement-version";
    if (sessionStorage.getItem(cle) === version) return;
    sessionStorage.setItem(cle, version);

    window.location.reload();
  } catch {
    // Pas de réseau : on réessaiera au prochain retour dans l'app.
  }
};
