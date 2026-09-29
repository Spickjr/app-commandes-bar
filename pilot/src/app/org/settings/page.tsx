import { requireOrgContext, requireUser, canAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ORG_ROLE_LABELS, PLAN_LABELS, type OrgRole } from "@/lib/constants";
import { SettingsForms } from "./settings-forms";
import { CategoriesManager } from "./categories-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComingSoon } from "@/components/shared/empty-state";

export default async function SettingsPage() {
  const user = await requireUser();
  const ctx = await requireOrgContext();

  const [org, categories, members] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: ctx.organizationId } }),
    prisma.category.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { name: "asc" } }),
    prisma.organizationMember.findMany({ where: { organizationId: ctx.organizationId }, include: { user: true } }),
  ]);

  return (
    <div>
      <PageHeader title="Paramètres" />

      <Tabs defaultValue="organization">
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
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-foreground">Membres ({members.length})</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">
                      {m.user.firstName} {m.user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{ORG_ROLE_LABELS[m.role as OrgRole] ?? m.role}</span>
                </div>
              ))}
              <div className="pt-3">
                <ComingSoon label="Invitations de membres" />
              </div>
            </CardContent>
          </Card>
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
