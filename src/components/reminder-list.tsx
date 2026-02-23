"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { fr } from "date-fns/locale";
import { EnrichedReminder } from "@/types";
import { ReminderCard } from "./reminder-card";
import { ViewToggle } from "./view-toggle";
import { StudentStats } from "./student-stats";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ReminderForm } from "./reminder-form";

interface ReminderListProps {
  classId: string | null;
  onCountChange: () => void;
}

export function ReminderList({
  classId,
  onCountChange,
}: ReminderListProps) {
  const [reminders, setReminders] = useState<
    EnrichedReminder[]
  >([]);
  const [viewMode, setViewMode] = useState<
    "by-student" | "chronological"
  >("by-student");
  const [searchQuery, setSearchQuery] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] =
    useState(false);
  const [editingReminder, setEditingReminder] =
    useState<EnrichedReminder | null>(null);
  const [statsStudentId, setStatsStudentId] =
    useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchReminders = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/reminders?classId=${classId}&pending=false`
      );
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [classId]);

  // Reset week offset when switching to chronological
  useEffect(() => {
    if (viewMode === "chronological") {
      setWeekOffset(0);
    }
  }, [viewMode]);

  const filteredReminders = reminders.filter(
    (reminder) =>
      reminder.studentFirstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      reminder.studentLastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleToggle = async (id: string) => {
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, isDone: !r.isDone } : r
      )
    );

    try {
      const res = await fetch(
        `/api/reminders/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toggleDone: true,
          }),
        }
      );

      if (!res.ok) {
        setReminders((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isDone: !r.isDone } : r
          )
        );
        toast.error("Erreur");
      } else {
        onCountChange();
      }
    } catch (error) {
      console.error("Error toggling reminder:", error);
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, isDone: !r.isDone } : r
        )
      );
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/reminders/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await fetchReminders();
        onCountChange();
        toast.success("Rappel supprimé");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Erreur");
    }
  };

  const handleEdit = (reminder: EnrichedReminder) => {
    setEditingReminder(reminder);
    setFormOpen(true);
  };

  const groupedByStudent = filteredReminders.reduce(
    (acc, reminder) => {
      const key = reminder.studentId;
      if (!acc[key]) {
        acc[key] = {
          studentId: reminder.studentId,
          firstName: reminder.studentFirstName,
          lastName: reminder.studentLastName,
          reminders: [],
        };
      }
      acc[key].reminders.push(reminder);
      return acc;
    },
    {} as Record<
      string,
      {
        studentId: string;
        firstName: string;
        lastName: string;
        reminders: EnrichedReminder[];
      }
    >
  );

  // Week boundaries for chronological view
  const currentWeekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const currentWeekEnd = useMemo(
    () => endOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );

  // Group reminders by day within the selected week
  const groupedByDay = useMemo(() => {
    if (viewMode !== "chronological") return [];

    const weekReminders = filteredReminders.filter((r) => {
      const date = parseISO(r.createdAt);
      return isWithinInterval(date, {
        start: currentWeekStart,
        end: currentWeekEnd,
      });
    });

    // Group by day string
    const groups: Record<string, EnrichedReminder[]> = {};
    for (const r of weekReminders) {
      const dayKey = format(parseISO(r.createdAt), "yyyy-MM-dd");
      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(r);
    }

    // Sort days descending (most recent first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dayKey, dayReminders]) => ({
        dayKey,
        label: format(parseISO(dayKey), "EEEE d MMMM", { locale: fr }),
        reminders: dayReminders,
      }));
  }, [viewMode, filteredReminders, currentWeekStart, currentWeekEnd]);

  const weekLabel = format(currentWeekStart, "d MMM", { locale: fr })
    + " – "
    + format(currentWeekEnd, "d MMM", { locale: fr });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  const hasReminders = reminders.length > 0;
  const hasResults = filteredReminders.length > 0;

  if (!hasReminders) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          Aucun rappel pour cette classe
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 w-3.5 h-3.5 text-muted-foreground -translate-y-1/2 pointer-events-none" />
            <Input
              placeholder="Chercher par élève..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              className="pl-8 h-8 text-sm"
            />
          </div>
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
          />
        </div>

        {/* Week navigator for chronological view */}
        {viewMode === "chronological" && (
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className={`text-xs font-medium ${
                weekOffset === 0
                  ? "text-foreground"
                  : "text-muted-foreground underline decoration-dotted underline-offset-2"
              }`}
            >
              {weekOffset === 0 ? "Cette semaine" : weekLabel}
            </button>
            <button
              onClick={() => setWeekOffset((w) => Math.min(w + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!hasResults && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun résultat pour &quot;{searchQuery}&quot;
          </p>
        )}

        {viewMode === "by-student"
          ? Object.entries(groupedByStudent).map(
              ([, group]) => (
                <div key={group.studentId}>
                  <h3
                    className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5 active:opacity-70"
                    onClick={() => setStatsStudentId(group.studentId)}
                  >
                    <span className="underline decoration-dotted underline-offset-2 cursor-pointer">
                      {group.lastName} {group.firstName}
                    </span>
                    <span className="text-[10px] font-normal">
                      ({group.reminders.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {group.reminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )
            )
          : groupedByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun rappel cette semaine
              </p>
            ) : (
              groupedByDay.map((day) => (
                <div key={day.dayKey}>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1.5 capitalize">
                    {day.label}
                    <span className="text-[10px] font-normal ml-1.5">
                      ({day.reminders.length})
                    </span>
                  </h3>
                  <div className="space-y-1">
                    {day.reminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        showStudentName
                        onToggle={handleToggle}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStudentTap={(studentId) => setStatsStudentId(studentId)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
      </div>

      <ReminderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        classId={classId}
        editReminder={editingReminder}
        onSaved={() => {
          fetchReminders();
          onCountChange();
          setEditingReminder(null);
        }}
      />

      <StudentStats
        studentId={statsStudentId}
        onClose={() => setStatsStudentId(null)}
      />
    </>
  );
}
