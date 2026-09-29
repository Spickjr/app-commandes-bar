import { requireOrgContext, requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shared/app-shell";
import type { OrgRole } from "@/lib/constants";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const [user, ctx] = await Promise.all([requireUser(), requireOrgContext()]);
  const memberships = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: { organization: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  const organizations = memberships.map((m) => m.organization);
  const org = organizations.find((o) => o.id === ctx.organizationId) ?? { id: ctx.organizationId, name: "" };

  return (
    <AppShell
      orgName={org.name}
      orgId={org.id}
      organizations={organizations}
      role={ctx.role as OrgRole}
      userName={`${user.firstName} ${user.lastName}`}
    >
      {children}
    </AppShell>
  );
}
