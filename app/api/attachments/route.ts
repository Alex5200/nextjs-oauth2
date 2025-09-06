import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  const commentId = searchParams.get("commentId");
  if (!taskId && !commentId) return NextResponse.json({ error: "Missing taskId or commentId" }, { status: 400 });
  const where: any = {};
  if (taskId) where.taskId = taskId;
  if (commentId) where.commentId = commentId;
  const items = await prisma.attachment.findMany({ where, orderBy: { createdAt: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }
  const formData = await req.formData();
  const taskId = String(formData.get("taskId") || "").trim() || null;
  const commentId = String(formData.get("commentId") || "").trim() || null;
  if (!taskId && !commentId) return NextResponse.json({ error: "Missing taskId or commentId" }, { status: 400 });

  const files = formData.getAll("files");
  const saved: any[] = [];
  const fs = await import("fs/promises");
  const path = await import("path");
  const baseDir = commentId ? "public/uploads/comments" : "public/uploads/tasks";
  await fs.mkdir(baseDir, { recursive: true });

  for (const f of files) {
    if (typeof f === "string") continue;
    const file = f as File;
    const mime = (file.type || "").toLowerCase();
    const isImage = mime.startsWith("image/");
    const isPdf = mime === "application/pdf";
    const isTxt = mime === "text/plain";
    // comments: only txt/pdf (enforced on /api/comments). For tasks: images + pdf + txt allowed here
    if (!commentId && !(isImage || isPdf || isTxt)) continue;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const nameSafe = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const fullPath = path.join(baseDir, nameSafe);
    await fs.writeFile(fullPath, buffer);
    const publicUrl = `${baseDir.replace('public', '')}/${nameSafe}`;

    const att = await prisma.attachment.create({
      data: {
        taskId: taskId || undefined,
        commentId: commentId || undefined,
        uploaderId: user.id,
        fileName: file.name,
        mimeType: mime,
        size: buffer.length,
        url: publicUrl,
      },
    });
    saved.push(att);
  }

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Optional: only uploader can delete
  if (att.uploaderId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const fs = await import("fs/promises");
  const path = await import("path");
  const fullPath = path.join(process.cwd(), "public", att.url.replace(/^\/+/, ""));
  try { await fs.unlink(fullPath); } catch {}

  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
