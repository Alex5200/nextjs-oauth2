"use client";
import { Tabs, Tab, Button } from "@heroui/react";

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  createdAt: string;
  user?: { name?: string | null; email?: string | null } | null;
};

export default function TasksTabs({
  myTasks,
  teamTasks,
  onDelete,
}: {
  myTasks: TaskItem[];
  teamTasks: TaskItem[];
  onDelete?: (id: string) => void;
}) {
  const renderTask = (t: TaskItem, showOwner?: boolean) => (
    <div key={t.id} className="flex items-start gap-2 border border-gray-200 rounded-md p-3">
      <div className="flex-1">
        <div className="text-sm font-medium">{t.title}</div>
        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
          {t.description && <span>{t.description}</span>}
          <span>•</span>
          <span>{new Date(t.createdAt).toLocaleString()}</span>
          <span>•</span>
          <span>{t.status}</span>
          {showOwner && t.user && (
            <>
              <span>•</span>
              <span>{t.user.name || t.user.email}</span>
            </>
          )}
        </div>
      </div>
      {onDelete && (
        <Button size="sm" variant="bordered" onPress={() => onDelete(t.id)}>
          Delete
        </Button>
      )}
    </div>
  );

  return (
    <Tabs aria-label="Tasks View" size="sm">
      <Tab key="my" title="Мои задачи">
        <div className="space-y-3">
          {myTasks.map((t) => renderTask(t, false))}
          {!myTasks.length && <div className="text-xs text-gray-500">Нет задач</div>}
        </div>
      </Tab>
      <Tab key="team" title="Задачи команды">
        <div className="space-y-3">
          {teamTasks.map((t) => renderTask(t, true))}
          {!teamTasks.length && <div className="text-xs text-gray-500">Нет командных задач</div>}
        </div>
      </Tab>
    </Tabs>
  );
}


