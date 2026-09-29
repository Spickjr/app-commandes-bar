import { requireOrgContext, requireUser, canAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PLAN_LABELS, type OrgRole } from "@/lib/constants";
import { SettingsForms } from "./settings-forms";
import { CategoriesManager } from "./categories-manager";
import { MembersManager } from "./members-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoon } from "@/components/shared/empty-state";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const user = await requireUser();
  const ctx = await requireOrgContext();
  const tab = (await searchParams).onglet ?? "organization";

  const [org, categories, members, invitations] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
    prisma.category.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { name: "asc" } }),
    prisma.organizationMember.findMany({
      where: { organizationId: ctx.organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    canAdmin(ctx.role)
      ? prisma.invitation.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);

  return (
    <div>
      <PageHeader title="Paramètres" />

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="organization">Organisation</TabsTrigger>
          <TabsTrigger value="members">Membres</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <Row label="Prénom" value={user.firstName} />
              <Row label="Nom" value={user.lastName} />
              <Row label="Email" value={user.email} />
              <div className="pt-1">
                <ComingSoon label="Modification du profil" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <SettingsForms org={org} canAdmin={canAdmin(ctx.role as OrgRole)} />
          <p className="mt-3 text-xs text-muted-foreground">Plan actuel : {PLAN_LABELS[org.plan] ?? org.plan}</p>
        </TabsContent>

        <TabsContent value="members">
          <MembersManager
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              name: `${m.user.firstName} ${m.user.lastName}`,
              email: m.user.email,
              role: m.role as OrgRole,
            }))}
            invitations={invitations.map((i) => ({
              id: i.id,
              email: i.email,
              role: i.role as OrgRole,
              token: i.token,
              expiresAt: i.expiresAt,
            }))}
            currentUserId={ctx.userId}
            actorRole={ctx.role}
          />
        </TabsContent>

        <TabsContent value="categories">
          <CategoriesManager categories={categories} canWrite={ctx.role !== "VIEWER"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
