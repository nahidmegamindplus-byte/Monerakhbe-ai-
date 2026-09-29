"use client";

import { useState, useEffect } from "react";
import Topbar from "@/components/layout/Topbar";
import TaskCard, { TaskItem } from "@/components/tasks/TaskCard";
import TaskModal from "@/components/tasks/TaskModal";
import { CheckSquare, Plus, ListTodo, CheckCircle2 } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) setTasks(data.tasks || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const todoTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div>
      <Topbar
        title="টাস্ক ও টু-ডু লিস্ট ✅"
        subtitle="আপনার দৈনন্দিন কাজের ট্র্যাকিং ও অগ্রগতি"
        onQuickAdd={() => setIsModalOpen(true)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Status Pills */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "ALL" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
            }`}
          >
            সব টাস্ক ({tasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("TODO")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "TODO" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
            }`}
          >
            পেন্ডিং ({todoTasks.length})
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === "COMPLETED" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
            }`}
          >
            সম্পন্ন ({completedTasks.length})
          </button>
        </div>

        {tasks.length === 0 && !loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs">
            <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">কোনো টাস্ক নেই</h3>
            <p className="text-xs text-slate-500 mt-1">নতুন টাস্ক যোগ করতে বাটনে ক্লিক করুন।</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
            >
              + নতুন টাস্ক যোগ করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                onStatusChange={fetchTasks}
                onDelete={fetchTasks}
              />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchTasks}
      />
    </div>
  );
}
