"use client";

import { ClassData } from "@/types";

const COLOR_STYLES: Record<
  string,
  { active: string; inactive: string }
> = {
  blue: {
    active:
      "ring-2 ring-class-blue border-class-blue bg-class-blue-bg text-class-blue font-bold shadow-md",
    inactive:
      "border-class-blue/25 bg-class-blue-subtle text-class-blue/60",
  },
  cyan: {
    active:
      "ring-2 ring-class-cyan border-class-cyan bg-class-cyan-bg text-class-cyan font-bold shadow-md",
    inactive:
      "border-class-cyan/25 bg-class-cyan-subtle text-class-cyan/60",
  },
  green: {
    active:
      "ring-2 ring-class-green border-class-green bg-class-green-bg text-class-green font-bold shadow-md",
    inactive:
      "border-class-green/25 bg-class-green-subtle text-class-green/60",
  },
  lime: {
    active:
      "ring-2 ring-class-lime border-class-lime bg-class-lime-bg text-class-lime font-bold shadow-md",
    inactive:
      "border-class-lime/25 bg-class-lime-subtle text-class-lime/60",
  },
  purple: {
    active:
      "ring-2 ring-class-purple border-class-purple bg-class-purple-bg text-class-purple font-bold shadow-md",
    inactive:
      "border-class-purple/25 bg-class-purple-subtle text-class-purple/60",
  },
};

interface ClassChipsProps {
  classes: ClassData[];
  selectedId: string | null;
  pendingCounts: Record<string, number>;
  onSelect: (classId: string) => void;
}

export function ClassChips({
  classes,
  selectedId,
  pendingCounts,
  onSelect,
}: ClassChipsProps) {
  return (
    <div className="flex gap-1.5 px-3 py-2.5">
      {classes.map((cls) => {
        const isActive = selectedId === cls.id;
        const styles =
          COLOR_STYLES[cls.color] ||
          COLOR_STYLES.blue;
        const styles_to_use = isActive
          ? styles.active
          : styles.inactive;
        const pendingCount = pendingCounts[cls.id] || 0;

        return (
          <button
            key={cls.id}
            onClick={() => onSelect(cls.id)}
            className={`relative flex-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all flex items-center justify-center gap-1 ${styles_to_use}`}
          >
            {cls.name}
            {pendingCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-destructive/20 text-destructive text-[10px] font-bold inline-flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
