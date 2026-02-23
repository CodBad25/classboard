"use client";

import { Trash2 } from "lucide-react";
import { format, isPast, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { EnrichedReminder } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

interface ReminderCardProps {
  reminder: EnrichedReminder;
  showStudentName?: boolean;
  onToggle: (id: string) => void;
  onEdit: (reminder: EnrichedReminder) => void;
  onDelete: (id: string) => void;
  onStudentTap?: (studentId: string) => void;
}

export function ReminderCard({
  reminder,
  showStudentName,
  onToggle,
  onEdit,
  onDelete,
  onStudentTap,
}: ReminderCardProps) {
  const isOverdue =
    reminder.dueDate &&
    isPast(parseISO(reminder.dueDate)) &&
    !reminder.isDone;

  const genderDot =
    reminder.studentGender === "F"
      ? "bg-pink-400"
      : reminder.studentGender === "M"
        ? "bg-blue-400"
        : null;

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2 rounded-lg border transition-all ${
        reminder.isDone
          ? "bg-muted/20 border-border/50 opacity-60"
          : "bg-card border-border"
      }`}
    >
      <Checkbox
        checked={reminder.isDone}
        onCheckedChange={() => onToggle(reminder.id)}
        className="mt-0.5 size-4"
      />
      <div className="flex-1 min-w-0" onClick={() => onEdit(reminder)}>
        {showStudentName && (
          <div
            className="flex items-center gap-1.5 mb-0.5 active:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onStudentTap?.(reminder.studentId);
            }}
          >
            {genderDot && (
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${genderDot}`} />
            )}
            <span className="text-[11px] text-muted-foreground font-medium underline decoration-dotted underline-offset-2 cursor-pointer">
              {reminder.studentLastName} {reminder.studentFirstName}
            </span>
          </div>
        )}
        <p
          className={`text-sm leading-snug ${
            reminder.isDone
              ? "line-through text-muted-foreground"
              : ""
          }`}
        >
          {reminder.text}
        </p>
        <div className="flex gap-1.5 mt-0.5 items-center flex-wrap">
          {reminder.categoryLabel && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: `var(--color-cat-${reminder.categoryColor}-bg)`,
                color: `var(--color-cat-${reminder.categoryColor})`,
              }}
            >
              {reminder.categoryIcon} {reminder.categoryLabel}
            </span>
          )}
          {reminder.dueDate && (
            <span
              className={`text-[10px] ${
                isOverdue
                  ? "text-destructive font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {format(parseISO(reminder.dueDate), "d MMM", {
                locale: fr,
              })}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(reminder.id)}
        className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive transition-colors flex-shrink-0"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}
