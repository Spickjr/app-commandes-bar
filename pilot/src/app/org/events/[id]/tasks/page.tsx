import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { EventNav } from "@/components/shared/event-nav";
import { TasksClient } from "@/components/tasks/tasks-client";

export default async function EventTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireOrgContext();

  const event = await prisma.event.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!event) notFound();

  const tasks = await prisma.task.findMany({
    where: { eventId: id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <div>
      <PageHeader title={event.name} description="Tâches" />
      <EventNav eventId={id} />
      <TasksClient
        tasks={tasks.map((t) => ({ ...t, dueDate: t.dueDate?.toISOString() ?? null }))}
        events={[]}
        fixedEventId={id}
        canWrite={["OWNER", "ADMIN", "MANAGER", "MEMBER"].includes(ctx.role)}
      />
    </div>
  );
}
