import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function TasksPage() {
  const ctx = await requireOrgContext();

  const [tasks, events] = await Promise.all([
    prisma.task.findMany({
      where: { organizationId: ctx.organizationId },
      include: { event: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.event.findMany({ where: { organizationId: ctx.organizationId }, select: { id: true, name: true }, orderBy: { date: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Tâches" description="Vue globale, toutes les tâches de l'organisation" />
      <TasksClient
        tasks={tasks.map((t) => ({ ...t, dueDate: t.dueDate?.toISOString() ?? null, eventName: t.event?.name ?? null }))}
        events={events}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
