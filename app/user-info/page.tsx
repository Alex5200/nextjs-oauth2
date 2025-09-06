import { auth } from "@/app/auth";
import Image from "next/image";
import Link from "next/link";
import { SignoutButton, SinginButton } from "@/app/components/singin-button";
import { Suspense } from "react";
import SessionLogger from "./session-logger";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export default async function UserInfoPage() {
  const session = await auth();

  if (session?.user) {
    const name = session.user.name ?? "User";
    const email = session.user.email ?? "";
    const image = typeof session.user.image === "string" ? session.user.image : undefined;
    const id = (session.user as any).id as string | undefined;
    const provider = (session.user as any).provider as string | undefined;

    // загрузим команды пользователя для формы приглашений
    const self = await prisma.user.findUnique({ where: { email: session.user.email ?? undefined } });
    const myTeams = self
      ? await prisma.teamMember.findMany({ where: { userId: self.id }, include: { team: true }, orderBy: { joinedAt: "desc" } })
      : [];

    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Your profile</h1>
            <p className="text-sm text-gray-500">Authenticated via {provider}</p>
          </div>

          <div className="flex items-center gap-3">
            {image && (
              <Image className="rounded-full border border-gray-200" src={image} alt={`${name}'s avatar`} width={72} height={72} />
            )}
            <div className="space-y-1">
              <p className="text-sm text-gray-900"><span className="font-medium">Name:</span> {name}</p>
              {email && <p className="text-sm text-gray-900"><span className="font-medium">Email:</span> {email}</p>}
              {id && <p className="text-sm text-gray-900"><span className="font-medium">ID:</span> {id}</p>}
            </div>
          </div>

          <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <summary className="cursor-pointer select-none">Session (JSON)</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">{JSON.stringify(session, null, 2)}</pre>
          </details>

          <div className="pt-2">
            <Suspense fallback={null}>
              <SessionLogger />
            </Suspense>
            <div className="pt-3">
              <SignoutButton />
            </div>
            <div className="pt-3 text-center">
              <Link href="/tasks" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                Перейти к моим задачам
              </Link>
            </div>
            <hr className="my-4" />
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-gray-900">Команды</h2>
              <form className="flex gap-2" action={async (formData: FormData) => {
                "use server";
                const name = String(formData.get("team_name") || "").trim();
                const description = String(formData.get("team_desc") || "").trim();
                if (!name || !self) return;
                const team = await prisma.team.create({ data: { name, description: description || null } });
                await prisma.teamMember.create({ data: { teamId: team.id, userId: self.id, role: "OWNER" } });
                revalidatePath("/user-info");
              }}>
                <input name="team_name" placeholder="Название команды" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button type="submit" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Создать</button>
              </form>
              <form className="flex flex-col gap-2" action={async (formData: FormData) => {
                "use server";
                const emailToInvite = String(formData.get("invite_email") || "").trim();
                const teamId = String(formData.get("invite_team") || "").trim();
                if (!emailToInvite || !teamId) return;
                // найдём или создадим пользователя-заготовку
                let userToAdd = await prisma.user.findUnique({ where: { email: emailToInvite } });
                if (!userToAdd) {
                  userToAdd = await prisma.user.create({ data: { email: emailToInvite } });
                }
                // добавим в команду, если ещё не участник
                await prisma.teamMember.upsert({
                  where: { teamId_userId: { teamId, userId: userToAdd.id } },
                  update: {},
                  create: { teamId, userId: userToAdd.id, role: "MEMBER" },
                });
                revalidatePath("/user-info");
              }}>
                <div className="flex gap-2">
                  <input type="email" name="invite_email" placeholder="email участника" className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                  <select name="invite_team" className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                    <option value="">Выберите команду</option>
                    {myTeams.map((m) => (
                      <option key={m.team.id} value={m.team.id}>{m.team.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 w-fit">Добавить в команду</button>
              </form>
              {!!myTeams.length && (
                <div className="text-xs text-gray-600">
                  Мои команды: {myTeams.map((m) => m.team.name).join(", ")}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>User Info</h1>
      <p>You are not signed in</p>
      <SinginButton />
    </div>
  );
}