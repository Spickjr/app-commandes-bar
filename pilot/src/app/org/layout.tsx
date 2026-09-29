import { requireOrgContext, requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shared/app-shell";
import type { OrgRole } from "@/lib/constants";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const [user, ctx] = await Promise.all([requireUser(), requireOrgContext()]);
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } });

  return (
    <AppShell orgName={org.name} role={ctx.role as OrgRole} userName={`${user.firstName} ${user.lastName}`}>
      {children}
    </AppShell>
  );
}
