import Link from "next/link";
import { Compass } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { acceptInvitationAction } from "@/actions/members";
import { signOutAction } from "@/actions/auth";
import { ORG_ROLE_DESCRIPTIONS, ORG_ROLE_LABELS, type OrgRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [invitation, user] = await Promise.all([
    prisma.invitation.findUnique({ where: { token }, include: { organization: true } }),
    getCurrentUser(),
  ]);

  const next = encodeURIComponent(`/invite/${token}`);
  const valid = invitation && invitation.expiresAt > new Date();
  const alreadyMember =
    valid && user
      ? await prisma.organizationMember.findUnique({
          where: { organizationId_userId: { organizationId: invitation.organizationId, userId: user.id } },
        })
      : null;
  const role = invitation?.role as OrgRole | undefined;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex items-center justify-center gap-2">
          <Compass className="h-5 w-5" />
          <span className="text-sm font-semibold">PILOT</span>
        </div>

        {!valid ? (
          <>
            <h1 className="mb-2 text-lg font-semibold">Invitation invalide</h1>
            <p className="text-sm text-muted-foreground">
              Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien à la personne qui vous a invité·e.
            </p>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-lg font-semibold">Rejoindre {invitation.organization.name}</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              Invitation pour <span className="text-foreground">{invitation.email}</span> en tant que{" "}
              <span className="text-foreground">{role ? ORG_ROLE_LABELS[role] ?? role : ""}</span>
              {role && ORG_ROLE_DESCRIPTIONS[role] ? ` — ${ORG_ROLE_DESCRIPTIONS[role].toLowerCase()}.` : "."}
            </p>

            {!user ? (
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href={`/signup?next=${next}`}>Créer mon compte</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/login?next=${next}`}>J&apos;ai déjà un compte</Link>
                </Button>
              </div>
            ) : alreadyMember ? (
              <Button asChild>
                <Link href="/org/dashboard">Vous êtes déjà membre — ouvrir PILOT</Link>
              </Button>
            ) : user.email.toLowerCase() !== invitation.email ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-destructive">
                  Vous êtes connecté·e avec {user.email}. Connectez-vous avec {invitation.email} pour accepter.
                </p>
                <form action={signOutAction}>
                  <Button type="submit" variant="outline" className="w-full">
                    Changer de compte
                  </Button>
                </form>
              </div>
            ) : (
              <form action={acceptInvitationAction}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" className="w-full">
                  Accepter l&apos;invitation
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
