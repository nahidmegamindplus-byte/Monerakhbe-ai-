"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Bell, CheckCircle2 } from "lucide-react";
import { formatFriendlyDate } from "@/lib/date-utils";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reminders");
      const data = await res.json();
      if (data.success) {
        setEvents(data.reminders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentDate, viewMode]);

  const handlePrev = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  // Month view calculations
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5">
      {/* Calendar Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {format(currentDate, viewMode === "day" ? "dd MMMM yyyy" : "MMMM yyyy")}
            </h3>
            <p className="text-xs text-slate-400 font-medium">রিমাইন্ডার ও কাজের শিডিউল</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(["month", "week", "day"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  viewMode === m ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {m === "month" ? "মাস" : m === "week" ? "সপ্তাহ" : "দিন"}
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              আজ
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === "month" && (
        <div className="mt-4">
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-2 border-b border-slate-100">
            <div>রবি</div>
            <div>সোম</div>
            <div>মঙ্গল</div>
            <div>বুধ</div>
            <div>বৃহস্পতি</div>
            <div>শুক্র</div>
            <div>শনি</div>
          </div>

          <div className="grid grid-cols-7 border-l border-t border-slate-100 mt-1">
            {days.map((day, idx) => {
              const dayEvents = events.filter((e) => isSameDay(new Date(e.dueAt), day));
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 border-r border-b border-slate-100 flex flex-col justify-between transition-colors ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50/50 text-slate-300"
                  } ${isToday ? "bg-indigo-50/30 font-bold" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isToday ? "bg-indigo-600 text-white font-bold" : "text-slate-700 font-medium"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className={`w-full text-left truncate text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                          e.status === "COMPLETED"
                            ? "bg-slate-100 text-slate-400 line-through"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {format(new Date(e.dueAt), "HH:mm")} {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-[10px] text-slate-400 pl-1">+{dayEvents.length - 2} আরও</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Details Modal Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="text-base font-bold text-slate-900">{selectedEvent.title}</h4>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {selectedEvent.description || "কোনো অতিরিক্ত বিবরণ নেই।"}
            </p>

            <div className="mt-3 space-y-1.5 text-xs text-slate-600">
              <p className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                {formatFriendlyDate(selectedEvent.dueAt)}
              </p>
              <p className="text-[11px] text-slate-400">
                স্ট্যাটাস: <span className="font-semibold text-indigo-600">{selectedEvent.status}</span>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
