"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Card, CardHeader, CardBody, Chip, Image } from "@heroui/react";

export type TeamOption = { id: string; name: string };
export type Task = { id: string; title: string; description?: string | null; status: "TODO" | "IN_PROGRESS" | "DONE"; imageUrl?: string | null; createdAt: string };

function statusColor(status: Task["status"]) {
  switch (status) {
    case "DONE": return "success";
    case "IN_PROGRESS": return "warning";
    default: return "default";
  }
}

export default function TaskItem({ task, teams, onSaved, onDeleted }: { task: Task; teams: TeamOption[]; onSaved?: () => void; onDeleted?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLSelectElement>(null);
  const teamRef = useRef<HTMLSelectElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadAttachments = async () => {
    try {
      const res = await fetch(`/api/attachments?taskId=${encodeURIComponent(task.id)}`);
      const ct = res.headers.get("content-type") || "";
      if (res.ok && ct.includes("application/json")) {
        const data = await res.json();
        setAttachments(Array.isArray(data) ? data : []);
      } else {
        setAttachments([]);
      }
    } catch {
      setAttachments([]);
    }
  };

  useEffect(() => { loadAttachments(); }, [task.id]);

  const saveTask = async () => {
    setSaving(true);
    try {
      const body = {
        id: task.id,
        title: titleRef.current?.value || task.title,
        description: descRef.current?.value || "",
        status: (statusRef.current?.value as any) || task.status,
        teamId: teamRef.current?.value || "",
        imageUrl: imageRef.current?.value || "",
      };
      await fetch(`/api/tasks`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setEditing(false);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  const deleteTask = async () => {
    await fetch(`/api/tasks?id=${encodeURIComponent(task.id)}`, { method: "DELETE" });
    onDeleted?.();
  };

  const uploadFiles = async () => {
    const files = fileRef.current?.files;
    if (!files || !files.length) return;
    const fd = new FormData();
    fd.append("taskId", task.id);
    for (const f of Array.from(files)) fd.append("files", f);
    await fetch(`/api/attachments`, { method: "POST", body: fd });
    if (fileRef.current) fileRef.current.value = "";
    loadAttachments();
  };

  return (
    <Card radius="lg" className="shadow-sm border border-default-200">
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {task.imageUrl ? (
            <Image alt={task.title} src={task.imageUrl} width={56} height={56} radius="sm" className="object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-md bg-default-100 flex items-center justify-center text-default-500 text-xs">No
              Img
            </div>
          )}
          <div>
            <div className="text-sm font-semibold leading-5">{task.title}</div>
            <div className="text-xs text-default-500 mt-0.5">
              {task.description || "Без описания"}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-default-500">
              <span>{new Date(task.createdAt).toLocaleString()}</span>
              <span>•</span>
              <Chip size="sm" color={statusColor(task.status)} variant="flat" className="capitalize">
                {task.status.replace("_", " ")}
              </Chip>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="solid" color={editing ? "secondary" : "primary"} onPress={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
          <Button size="sm" variant="flat" color="danger" onPress={deleteTask}>Delete</Button>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        {editing && (
          <div className="flex flex-col gap-3 p-3 rounded-lg bg-default-50 border border-default-200">
            <input name="title" defaultValue={task.title} ref={titleRef} className="rounded-md border border-gray-300 px-2 py-1 text-sm" />
            <input name="description" defaultValue={task.description ?? ""} ref={descRef} className="rounded-md border border-gray-300 px-2 py-1 text-sm" placeholder="description" />
            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
              <select name="status" defaultValue={task.status} ref={statusRef} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
              <select name="teamId" defaultValue="" ref={teamRef} className="rounded-md border border-gray-300 px-2 py-1 text-sm">
                <option value="">Личная</option>
                {teams.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input name="imageUrl" defaultValue={task.imageUrl ?? ""} ref={imageRef} className="rounded-md border border-gray-300 px-2 py-1 text-sm flex-1 min-w-[220px]" placeholder="Image URL" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="solid" color="primary" isLoading={saving} onPress={saveTask}>Save</Button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-xs font-medium mb-2 text-default-600">Вложения</div>
          <div className="flex flex-wrap gap-2 mb-3">
            {attachments.map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noreferrer">
                <Chip size="sm" variant="flat" color="default" className="max-w-[220px] truncate">{a.fileName}</Chip>
              </a>
            ))}
            {!attachments.length && <div className="text-xs text-default-400">Нет вложений</div>}
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" multiple accept="image/*,application/pdf,text/plain" className="text-xs" />
            <Button size="sm" variant="flat" onPress={uploadFiles}>Загрузить</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
