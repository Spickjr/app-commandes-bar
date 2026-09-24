// Version actuellement en ligne (identifiant du commit déployé par Vercel).
// Les appareils la comparent à la leur pour se mettre à jour tout seuls.

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ version: process.env.VERCEL_GIT_COMMIT_SHA || null });
}
