import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ teams: [] });
  const teams = await prisma.teamMember.findMany({ where: { userId: user.id }, include: { team: true } });
  return NextResponse.json({ teams });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const team = await prisma.team.create({ data: { name: body.name, description: body.description ?? null } });
  await prisma.teamMember.create({ data: { teamId: team.id, userId: user.id, role: "OWNER" } });
  return NextResponse.json({ team }, { status: 201 });
}


