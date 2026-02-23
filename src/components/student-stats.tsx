"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StudentStatsProps {
  studentId: string | null;
  onClose: () => void;
}

interface CategoryStat {
  label: string;
  icon: string;
  color: string;
  count: number;
}

interface StatsReminder {
  id: string;
  text: string;
  isDone: boolean;
  createdAt: string;
  dueDate: string | null;
  categoryLabel: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

interface StatsData {
  student: {
    firstName: string;
    lastName: string;
    gender: string | null;
    className: string;
    classColor: string;
  };
  stats: {
    total: number;
    done: number;
    pending: number;
    byCategory: CategoryStat[];
    noCategory: number;
  };
  reminders: StatsReminder[];
}

export function StudentStats({ studentId, onClose }: StudentStatsProps) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setData(null);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/students/stats?studentId=${studentId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [studentId]);

  if (!studentId) return null;

  const genderDot =
    data?.student.gender === "F"
      ? "bg-pink-400"
      : data?.student.gender === "M"
        ? "bg-blue-400"
        : null;

  return (
    <Dialog open={!!studentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] rounded-xl max-h-[85dvh] flex flex-col gap-0 p-4 !top-4 !translate-y-0">
        <DialogHeader className="shrink-0 pb-3">
          <DialogTitle className="text-base flex items-center gap-2">
            {genderDot && (
              <span className={`w-2 h-2 rounded-full ${genderDot}`} />
            )}
            {data ? (
              <>
                {data.student.lastName} {data.student.firstName}
                <span
                  className="text-xs font-normal px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `var(--color-class-${data.student.classColor}-bg)`,
                    color: `var(--color-class-${data.student.classColor})`,
                  }}
                >
                  {data.student.className}
                </span>
              </>
            ) : (
              "Chargement..."
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Chargement...
          </div>
        )}

        {data && !loading && (
          <div className="flex flex-col gap-3 overflow-y-auto flex-1">
            {/* Summary counters */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/30 rounded-lg p-2.5 text-center">
                <div className="text-xl font-bold">{data.stats.total}</div>
                <div className="text-[10px] text-muted-foreground">Total</div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-2.5 text-center">
                <div className="text-xl font-bold text-destructive">
                  {data.stats.pending}
                </div>
                <div className="text-[10px] text-muted-foreground">En cours</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2.5 text-center">
                <div className="text-xl font-bold text-green-500">
                  {data.stats.done}
                </div>
                <div className="text-[10px] text-muted-foreground">Terminés</div>
              </div>
            </div>

            {/* By category */}
            {data.stats.byCategory.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">
                  Par catégorie
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {data.stats.byCategory.map((cat) => (
                    <div
                      key={cat.label}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold"
                      style={{
                        backgroundColor: `var(--color-cat-${cat.color}-bg)`,
                        color: `var(--color-cat-${cat.color})`,
                      }}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                      <span className="font-bold ml-0.5">×{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reminders history */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-1.5">
                Historique
              </h3>
              <div className="flex flex-col gap-1">
                {data.reminders.map((r) => (
                  <div
                    key={r.id}
                    className={`flex items-start gap-2 px-2.5 py-1.5 rounded-md border text-xs ${
                      r.isDone
                        ? "bg-muted/20 border-border/50 opacity-50"
                        : "bg-card border-border"
                    }`}
                  >
                    <span className="mt-0.5">
                      {r.isDone ? "✅" : "⬜"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`leading-snug ${
                          r.isDone ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {r.text}
                      </p>
                      <div className="flex gap-1.5 mt-0.5 items-center">
                        {r.categoryLabel && (
                          <span
                            className="text-[9px] font-semibold px-1 py-0.5 rounded"
                            style={{
                              backgroundColor: `var(--color-cat-${r.categoryColor}-bg)`,
                              color: `var(--color-cat-${r.categoryColor})`,
                            }}
                          >
                            {r.categoryIcon} {r.categoryLabel}
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground">
                          {format(parseISO(r.createdAt), "d MMM yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.reminders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aucun rappel pour cet élève
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
