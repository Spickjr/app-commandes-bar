import { supabase } from "../../_lib/supabase";

// Réveil quotidien de Supabase.
// Le plan gratuit met la base en pause après ~7 jours sans activité :
// Vercel appelle cette route une fois par jour (voir vercel.json)
// pour qu'elle reste toujours disponible avant un événement.

// Jamais mis en cache : la requête doit vraiment atteindre Supabase.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Si CRON_SECRET est défini sur Vercel, seul le planificateur Vercel peut appeler la route.
  const secret = process.env.CRON_SECRET;

  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const { error } = await supabase.from("tables").select("table_name").limit(1);

  if (error) {
    return Response.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, date: new Date().toISOString() });
}
