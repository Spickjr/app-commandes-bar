"use server";

import { randomBytes } from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  requireOrgContext,
  requireUser,
  canAdmin,
  setActiveOrganization,
  ACTIVE_ORG_COOKIE,
  type OrgContext,
} from "@/lib/session";
import { INVITATION_TTL_DAYS, ORG_ROLES, type OrgRole } from "@/lib/constants";
import type { SimpleFormState } from "./expenses";

export interface InvitationFormState {
  error?: string;
  token?: string;
}

/** Un admin ne peut ni nommer ni modifier un propriétaire — seul un propriétaire le peut. */
function canAssignRole(actor: OrgRole, role: OrgRole) {
  return actor === "OWNER" || (canAdmin(actor) && role !== "OWNER");
}

async function countOwners(organizationId: string) {
  return prisma.organizationMember.count({ where: { organizationId, role: "OWNER" } });
}

async function audit(ctx: OrgContext, action: string, entityType: string, entityId: string) {
  await prisma.auditLog.create({
    data: { organizationId: ctx.organizationId, userId: ctx.userId, action, entityType, entityId },
  });
}

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(ORG_ROLES, { message: "Rôle invalide" }),
});

export async function createInvitationAction(
  _prev: InvitationFormState,
  formData: FormData
): Promise<InvitationFormState> {
  const ctx = await requireOrgContext();
  if (!canAdmin(ctx.role)) return { error: "Seuls les propriétaires et admins peuvent inviter." };

  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Données invalides" };

  const email = parsed.data.email.toLowerCase().trim();
  const { role } = parsed.data;
  if (!canAssignRole(ctx.role, role)) return { error: "Seul un propriétaire peut inviter un propriétaire." };

  const alreadyMember = await prisma.organizationMember.findFirst({
    where: { organizationId: ctx.organizationId, user: { email } },
  });
  if (alreadyMember) return { error: "Cette personne fait déjà partie de l'organisation." };

  // Réinviter la même adresse remplace l'invitation précédente (nouveau lien, nouveau rôle).
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const invitation = await prisma.invitation.upsert({
    where: { organizationId_email: { organizationId: ctx.organizationId, email } },
    create: { organizationId: ctx.organizationId, email, role, token, expiresAt, invitedById: ctx.userId },
    update: { role, token, expiresAt, invitedById: ctx.userId },
  });

  await audit(ctx, "CREATE", "Invitation", invitation.id);
  revalidatePath("/org/settings");
  return { token };
}

export async function revokeInvitationAction(formData: FormData) {
  const ctx = await requireOrgContext();
  if (!canAdmin(ctx.role)) return;
  const invitationId = String(formData.get("invitationId"));

  await prisma.invitation.deleteMany({ where: { id: invitationId, organizationId: ctx.organizationId } });
  await audit(ctx, "DELETE", "Invitation", invitationId);
  revalidatePath("/org/settings");
}

export async function updateMemberRoleAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  if (!canAdmin(ctx.role)) return { error: "Seuls les propriétaires et admins peuvent changer les rôles." };

  const memberId = String(formData.get("memberId"));
  const role = String(formData.get("role")) as OrgRole;
  if (!ORG_ROLES.includes(role)) return { error: "Rôle invalide" };

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organizationId },
  });
  if (!member) return { error: "Membre introuvable." };
  if (member.role === role) return {};

  if (!canAssignRole(ctx.role, member.role as OrgRole) || !canAssignRole(ctx.role, role)) {
    return { error: "Seul un propriétaire peut modifier le rôle de propriétaire." };
  }
  if (member.role === "OWNER" && (await countOwners(ctx.organizationId)) <= 1) {
    return { error: "L'organisation doit garder au moins un propriétaire." };
  }

  await prisma.organizationMember.update({ where: { id: member.id }, data: { role } });
  await audit(ctx, "UPDATE", "OrganizationMember", member.id);
  revalidatePath("/org", "layout");
  return {};
}

export async function removeMemberAction(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();
  if (!canAdmin(ctx.role)) return { error: "Seuls les propriétaires et admins peuvent retirer un membre." };

  const memberId = String(formData.get("memberId"));
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organizationId },
  });
  if (!member) return { error: "Membre introuvable." };
  if (member.userId === ctx.userId) return { error: "Pour partir, utilisez « Quitter l'organisation »." };
  if (!canAssignRole(ctx.role, member.role as OrgRole)) {
    return { error: "Seul un propriétaire peut retirer un propriétaire." };
  }

  await prisma.organizationMember.delete({ where: { id: member.id } });
  await audit(ctx, "DELETE", "OrganizationMember", member.id);
  revalidatePath("/org/settings");
  return {};
}

export async function leaveOrganizationAction(_prev: SimpleFormState, _formData: FormData): Promise<SimpleFormState> {
  const ctx = await requireOrgContext();

  if (ctx.role === "OWNER" && (await countOwners(ctx.organizationId)) <= 1) {
    return { error: "Vous êtes le seul propriétaire : nommez-en un autre avant de partir." };
  }

  await prisma.organizationMember.delete({
    where: { organizationId_userId: { organizationId: ctx.organizationId, userId: ctx.userId } },
  });
  await audit(ctx, "DELETE", "OrganizationMember", ctx.userId);
  (await cookies()).delete(ACTIVE_ORG_COOKIE);
  redirect("/org/dashboard");
}

export async function acceptInvitationAction(formData: FormData) {
  const user = await requireUser();
  const token = String(formData.get("token"));

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.expiresAt < new Date() || invitation.email !== user.email.toLowerCase()) {
    redirect(`/invite/${encodeURIComponent(token)}`);
  }

  // Transaction : l'invitation ne sert qu'une fois, même en cas de double clic.
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.invitation.deleteMany({ where: { id: invitation.id } });
    if (count === 0) return;
    await tx.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
      create: { organizationId: invitation.organizationId, userId: user.id, role: invitation.role },
      update: {},
    });
    await tx.auditLog.create({
      data: {
        organizationId: invitation.organizationId,
        userId: user.id,
        action: "CREATE",
        entityType: "OrganizationMember",
        entityId: user.id,
      },
    });
  });

  await setActiveOrganization(invitation.organizationId);
  redirect("/org/dashboard");
}

export async function switchOrganizationAction(formData: FormData) {
  const user = await requireUser();
  const organizationId = String(formData.get("organizationId"));

  const membership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });
  if (membership) await setActiveOrganization(organizationId);
  redirect("/org/dashboard");
}
