import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { teamId, email, role } = body as { teamId: string; email: string; role?: "OWNER" | "ADMIN" | "MEMBER" };

  const team = await prisma.team.findUnique({ where: { id: teamId }, include: { members: true } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // Проверяем, существует ли пользователь с таким email
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Если пользователь ещё не входил — создаём заготовку, аккаунт создастся при первом входе
    user = await prisma.user.create({ data: { email } });
  }

  // Добавляем в команду, если ещё не добавлен
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId, userId: user.id } },
    update: {},
    create: { teamId, userId: user.id, role: role ?? "MEMBER" },
  });

  return NextResponse.json({ ok: true });
}


