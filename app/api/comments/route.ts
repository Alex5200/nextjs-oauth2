import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/app/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: {
      author: { select: { name: true, email: true } },
      attachments: { select: { id: true, fileName: true, mimeType: true, size: true, url: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(comments);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentType = req.headers.get("content-type") || "";
  const author = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!author) return NextResponse.json({ error: "Author not found" }, { status: 404 });

  // If multipart, handle files upload (only txt/pdf allowed for comments)
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const taskId = String(formData.get("taskId") || "").trim();
    const body = String(formData.get("body") || "").trim();
    if (!taskId || !body) return NextResponse.json({ error: "Missing taskId or body" }, { status: 400 });

    const comment = await prisma.comment.create({ data: { taskId, authorId: author.id, body } });

    const ALLOWED = new Set(["text/plain", "application/pdf"]);
    const files = formData.getAll("files");
    const saved: any[] = [];
    for (const f of files) {
      if (typeof f === "string") continue;
      const file = f as File;
      const mime = file.type.toLowerCase();
      if (!ALLOWED.has(mime)) continue;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = file.name.split('.').pop() || '';
      const dir = `public/uploads/comments`;
      const fs = await import("fs/promises");
      const path = await import("path");
      await fs.mkdir(dir, { recursive: true });
      const nameSafe = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const fullPath = path.join(dir, nameSafe);
      await fs.writeFile(fullPath, buffer);
      const publicUrl = `/uploads/comments/${nameSafe}`;
      const att = await prisma.attachment.create({
        data: {
          commentId: comment.id,
          uploaderId: author.id,
          fileName: file.name,
          mimeType: mime,
          size: buffer.length,
          url: publicUrl,
        },
      });
      saved.push(att);
    }
    return NextResponse.json({ ...comment, attachments: saved }, { status: 201 });
  }

  // Fallback JSON body without files
  const json = await req.json();
  const comment = await prisma.comment.create({ data: { taskId: json.taskId, authorId: author.id, body: json.body } });
  return NextResponse.json(comment, { status: 201 });
}


