import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, getCurrentOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ nouvelle?: string }> }) {
  const user = await requireUser();
  const ctx = await getCurrentOrgContext();
  const additional = (await searchParams).nouvelle === "1";
  if (ctx && !additional) redirect("/org/dashboard");

  // Invitations en attente pour cet email : la personne invitée n'a pas à créer sa propre structure.
  const invitations = await prisma.invitation.findMany({
    where: { email: user.email.toLowerCase(), expiresAt: { gt: new Date() } },
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-lg font-semibold">
          {additional ? "Nouvelle organisation" : "Bienvenue sur PILOT"}
        </h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Parlez-nous de votre structure pour configurer votre espace.
        </p>

        {invitations.length > 0 && (
          <div className="mb-6 flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Vous avez été invité·e à rejoindre :</p>
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  {inv.organization.name}{" "}
                  <span className="text-muted-foreground">· {ORG_ROLE_LABELS[inv.role as OrgRole] ?? inv.role}</span>
                </span>
                <Button size="sm" asChild>
                  <Link href={`/invite/${inv.token}`}>Voir</Link>
                </Button>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted-foreground">Ou créez votre propre structure ci-dessous.</p>
          </div>
        )}

        <OnboardingForm additional={additional} />

        {additional && (
          <p className="mt-4 text-center text-sm">
            <Link href="/org/dashboard" className="text-muted-foreground underline underline-offset-4">
              Annuler
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
