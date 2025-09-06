"use client";
import { useEffect, useState, useRef } from "react";
import { Button, Input } from "@heroui/react";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author?: { name?: string | null; email?: string | null } | null;
  attachments?: { id: string; fileName: string; mimeType: string; size: number; url: string }[];
};

export default function Comments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?taskId=${encodeURIComponent(taskId)}`);
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        // try to extract error json, else fallback
        if (ct.includes("application/json")) {
          const err = await res.json();
          console.error("comments GET error:", err);
        } else {
          const txt = await res.text();
          console.error("comments GET error (text):", txt);
        }
        setComments([]);
      } else if (ct.includes("application/json")) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } else {
        setComments([]);
      }
    } catch (e) {
      console.error("comments GET exception:", e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [taskId]);

  const add = async () => {
    const body = inputRef.current?.value?.trim();
    if (!body) return;
    const files = fileRef.current?.files;
    if (files && files.length) {
      const fd = new FormData();
      fd.append("taskId", taskId);
      fd.append("body", body);
      for (const f of Array.from(files)) fd.append("files", f);
      await fetch(`/api/comments`, { method: "POST", body: fd });
    } else {
      await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, body }),
      });
    }
    if (inputRef.current) inputRef.current.value = "";
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <Input ref={inputRef} size="sm" placeholder="Комментарий" onKeyDown={(e) => { if (e.key === "Enter") add(); }} />
        <input ref={fileRef} type="file" multiple accept="application/pdf,text/plain" className="text-xs" />
        <Button size="sm" onPress={add}>Add</Button>
      </div>
      <div className="space-y-2">
        {loading ? (
          <div className="text-xs text-gray-500">Загрузка…</div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-md border border-gray-200 p-2">
              <div className="text-xs text-gray-500 mb-1">
                {(c.author?.name || c.author?.email || "User")} • {new Date(c.createdAt).toLocaleString()}
              </div>
              <div className="text-sm text-gray-900">{c.body}</div>
              {!!c.attachments?.length && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.attachments.map((a) => (
                    <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline break-all">
                      {a.fileName}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
        {!loading && !comments.length && <div className="text-xs text-gray-500">Нет комментариев</div>}
      </div>
    </div>
  );
}


