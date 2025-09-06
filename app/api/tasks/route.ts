import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({ where: { user: { email: session.user.email } }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      ...(body.teamId
        ? { team: { connect: { id: String(body.teamId) } } }
        : {}),
      user: { connect: { email: session.user.email } },
    },
  });
  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: body.id },
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status,
      imageUrl: body.imageUrl ?? null,
      ...(body.teamId === "" || body.teamId === null || typeof body.teamId === "undefined"
        ? { team: { disconnect: true } }
        : { team: { connect: { id: String(body.teamId) } } }),
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


