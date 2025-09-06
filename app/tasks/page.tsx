import { auth } from "@/app/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Card, CardHeader, CardBody, Input, Textarea, Button } from "@heroui/react";
import Link from "next/link";
import TasksStats from "./tasks-stats";
import TasksTabs from "./TasksTabs";
import TaskItem from "./TaskItem";
import Comments from "./comments";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const me = await prisma.user.findUnique({ where: { email: session.user.email } });
  const myTeams = me ? await prisma.teamMember.findMany({ where: { userId: me.id }, include: { team: true } }) : [];
  const tasks = await prisma.task.findMany({ where: { user: { email: session.user.email } }, orderBy: { createdAt: "desc" } });
  const teamTasks = me
    ? await prisma.task.findMany({
        where: { user: { teamMembers: { some: { team: { members: { some: { userId: me.id } } } } } } },
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-default-50 flex items-start justify-center p-6">
      <Card className="w-full max-w-2xl shadow-md">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Мои задачи</h1>
            <Link href="/user-info" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">Профиль</Link>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-2" action={async (formData: FormData) => {
            "use server";
            const title = String(formData.get("title") || "").trim();
            const description = String(formData.get("description") || "").trim();
            const teamId = String(formData.get("teamId") || "").trim() || null;
            const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
            if (!title || !session?.user?.email) return;
            await prisma.task.create({
              data: {
                title,
                description: description || null,
                imageUrl,
                ...(teamId ? { team: { connect: { id: teamId } } } : {}),
                user: { connect: { email: session.user.email } },
              },
            });
            revalidatePath("/tasks");
          }}>
            <Input name="title" placeholder="Название задачи" size="sm" className="min-w-[200px]" />
            <Input name="imageUrl" placeholder="Ссылка на изображение (опционально)" size="sm" className="min-w-[200px]" />
            <Textarea name="description" placeholder="Короткое описание (опционально)" size="sm" className="md:col-span-2" minRows={2} />
            <div className="flex items-center gap-2 md:col-span-2">
              <select name="teamId" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="">Личная</option>
                {myTeams.map((m) => (
                  <option key={m.team.id} value={m.team.id}>{m.team.name}</option>
                ))}
              </select>
              <Button type="submit" size="sm">Добавить</Button>
            </div>
          </form>
        </CardHeader>
        <CardBody className="space-y-6">
          <TasksStats tasks={tasks.map(t => ({ status: t.status, createdAt: t.createdAt }))} />
          <TasksTabs
            myTasks={tasks.map(t => ({ id: t.id, title: t.title, description: t.description, status: t.status, createdAt: t.createdAt as any }))}
            teamTasks={teamTasks.map(t => ({ id: t.id, title: t.title, description: t.description, status: t.status as any, createdAt: t.createdAt as any, user: t.user as any }))}
          />
          <div className="h-px bg-default-200" />
          {tasks.map((t) => (
            <div key={t.id} className="space-y-3">
              <TaskItem
                task={{ id: t.id, title: t.title, description: t.description, status: t.status as any, imageUrl: t.imageUrl ?? null, createdAt: t.createdAt as any }}
                teams={myTeams.map((m) => ({ id: m.team.id, name: m.team.name }))}
              />
              <Comments taskId={t.id} />
            </div>
          ))}
        </CardBody>
      </Card>
    </main>
  );
}


