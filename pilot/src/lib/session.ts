import { auth } from "./auth";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ADMIN_ROLES, WRITE_ROLES, type OrgRole } from "./constants";

/**
 * Toute page/action serveur qui touche des données d'organisation DOIT passer par
 * requireOrgContext(). C'est la seule porte d'entrée : elle vérifie la session,
 * l'appartenance à l'organisation, et renvoie le rôle — jamais de accès direct
 * à Prisma sans être passé par ici d'abord.
 */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user) return null;
  const userId = (session.user as { id?: string }).id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user;
});

export interface OrgContext {
  userId: string;
  organizationId: string;
  role: OrgRole;
}

/** Renvoie le contexte organisation courant de l'utilisateur, ou null s'il n'en a pas encore. */
export const getCurrentOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return null;

  return {
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role as OrgRole,
  };
});

/** À utiliser en tête de chaque page/action serveur protégée. Redirige si non authentifié. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirige vers /onboarding si l'utilisateur n'a pas encore d'organisation. */
export async function requireOrgContext(): Promise<OrgContext> {
  await requireUser();
  const ctx = await getCurrentOrgContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

export function canWrite(role: OrgRole): boolean {
  return WRITE_ROLES.includes(role);
}

export function canAdmin(role: OrgRole): boolean {
  return ADMIN_ROLES.includes(role);
}

/** À appeler dans toute Server Action de mutation — lève si le rôle est lecture seule. */
export function assertCanWrite(role: OrgRole) {
  if (!canWrite(role)) {
    throw new Error("Votre rôle (Lecteur) ne permet pas cette action.");
  }
}

export function assertCanAdmin(role: OrgRole) {
  if (!canAdmin(role)) {
    throw new Error("Seuls les propriétaires et admins peuvent effectuer cette action.");
  }
}
