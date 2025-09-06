"use client";
import { useMemo } from "react";

type Props = {
  tasks: { status: "TODO" | "IN_PROGRESS" | "DONE"; createdAt: string | Date }[];
};

export default function TasksStats({ tasks }: Props) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "TODO").length;
    const inProgress = tasks.filter(t => t.status === "IN_PROGRESS").length;
    const done = tasks.filter(t => t.status === "DONE").length;
    return { total, todo, inProgress, done };
  }, [tasks]);

  return (
    <div className="text-xs text-gray-600 flex gap-3">
      <span>Total: {stats.total}</span>
      <span>Todo: {stats.todo}</span>
      <span>In progress: {stats.inProgress}</span>
      <span>Done: {stats.done}</span>
    </div>
  );
}


