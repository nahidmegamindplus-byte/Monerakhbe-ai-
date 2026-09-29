"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Trash2, MoreVertical, Tag } from "lucide-react";
import { format } from "date-fns";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  dueTime?: string | null;
  category: string;
  tags?: string | null;
}

export default function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: TaskItem;
  onStatusChange?: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const isDone = task.status === "COMPLETED";

  const toggleComplete = async () => {
    setLoading(true);
    const newStatus = isDone ? "TODO" : "COMPLETED";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange?.(task.id, newStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${task.title}" টাস্কটি মুছে ফেলতে চান?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDelete?.(task.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`group p-4 rounded-2xl border transition-all duration-200 ${
        isDone
          ? "bg-slate-50/70 border-slate-200/60 opacity-60"
          : "bg-white border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={toggleComplete}
            disabled={loading}
            className={`mt-0.5 rounded-full p-0.5 transition-colors ${
              isDone ? "text-emerald-600" : "text-slate-300 hover:text-indigo-600"
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${isDone ? "fill-emerald-100" : ""}`} />
          </button>

          <div className="min-w-0 flex-1">
            <h4 className={`text-sm font-semibold text-slate-900 ${isDone ? "line-through text-slate-400" : ""}`}>
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                {task.category}
              </span>

              {task.dueDate && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-medium">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.dueDate), "dd MMM")}
                  {task.dueTime ? ` (${task.dueTime})` : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={loading}
          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
