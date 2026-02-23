"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { EnrichedReminder, SearchableStudent, Category } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentSearch } from "./student-search";

interface ReminderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  editReminder?: EnrichedReminder | null;
  onSaved: () => void;
}

export function ReminderForm({
  open,
  onOpenChange,
  classId,
  editReminder,
  onSaved,
}: ReminderFormProps) {
  const [selectedStudents, setSelectedStudents] = useState<
    SearchableStudent[]
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const selectedCat = categories.find((c) => c.id === selectedCategory);
  const isRetard = selectedCat?.label.toLowerCase() === "retard";
  const isMultiStudent = selectedStudents.length > 1;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    if (open) {
      fetchCategories();
      if (editReminder) {
        setText(editReminder.text);
        setDueDate(
          editReminder.dueDate
            ? editReminder.dueDate.split("T")[0]
            : ""
        );
        setSelectedCategory(editReminder.categoryId);
        setDelayMinutes("");
      } else {
        setText("");
        setDueDate("");
        setSelectedCategory(null);
        setSelectedStudents([]);
        setDelayMinutes("");
        setCreatedCount(0);
      }
    }
  }, [open, editReminder]);

  // Auto-fill text when selecting "Retard" + delay
  useEffect(() => {
    if (isRetard && delayMinutes && !editReminder) {
      setText(`Retard de ${delayMinutes} min`);
    }
  }, [isRetard, delayMinutes, editReminder]);

  const resetFormFields = () => {
    setText("");
    setDueDate("");
    setSelectedCategory(null);
    setDelayMinutes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Le texte du rappel est requis");
      return;
    }

    if (!editReminder && selectedStudents.length === 0) {
      toast.error("Sélectionner au moins un élève");
      return;
    }

    setLoading(true);
    try {
      if (editReminder) {
        const res = await fetch(
          `/api/reminders/${editReminder.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              dueDate: dueDate || null,
              categoryId: selectedCategory || null,
            }),
          }
        );

        if (res.ok) {
          toast.success("Rappel modifié");
          onSaved();
          onOpenChange(false);
        } else {
          toast.error("Erreur lors de la sauvegarde");
        }
      } else {
        const results = await Promise.all(
          selectedStudents.map((student) =>
            fetch("/api/reminders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                studentId: student.id,
                text,
                dueDate: dueDate || null,
                categoryId: selectedCategory || null,
              }),
            })
          )
        );

        const successCount = results.filter((r) => r.ok).length;

        if (successCount > 0) {
          const newTotal = createdCount + successCount;
          setCreatedCount(newTotal);
          onSaved();

          if (isMultiStudent) {
            // Multi-student: keep dialog open, reset form fields, keep students
            toast.success(
              successCount === 1
                ? "Rappel créé"
                : `Rappel ajouté à ${successCount} élèves`
            );
            resetFormFields();
          } else {
            // Single student: close dialog
            toast.success("Rappel créé");
            onOpenChange(false);
          }
        }

        if (successCount < selectedStudents.length) {
          toast.error(
            `${successCount}/${selectedStudents.length} rappels créés`
          );
        }
      }
    } catch (error) {
      console.error("Error saving reminder:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState && createdCount > 0) {
      onSaved();
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[92vw] rounded-xl max-h-[85dvh] flex flex-col gap-0 p-4 !top-4 !translate-y-0">
        <DialogHeader className="shrink-0 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base">
              {editReminder
                ? "Modifier le rappel"
                : "Nouveau rappel"}
            </DialogTitle>
            {createdCount > 0 && !editReminder && (
              <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {createdCount} créé{createdCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 overflow-y-auto flex-1"
        >
          {!editReminder && (
            <div>
              <Label className="text-xs">Élève(s)</Label>
              <StudentSearch
                onSelect={setSelectedStudents}
                selectedStudents={selectedStudents}
              />
            </div>
          )}

          {/* Categories Grid */}
          {categories.length > 0 && (
            <div>
              <Label className="text-xs mb-1">Catégorie</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (selectedCategory === cat.id) {
                        setSelectedCategory(null);
                        setDelayMinutes("");
                        setText("");
                      } else {
                        setSelectedCategory(cat.id);
                        if (cat.label.toLowerCase() !== "retard") {
                          setDelayMinutes("");
                        }
                        if (cat.defaultText) {
                          setText(cat.defaultText);
                        } else {
                          setText("");
                        }
                      }
                    }}
                    style={{
                      backgroundColor: `var(--color-cat-${cat.color}-bg)`,
                      color: `var(--color-cat-${cat.color})`,
                    }}
                    className={`px-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all text-center leading-tight truncate ${
                      selectedCategory === cat.id
                        ? "ring-2 ring-current/40 shadow-sm"
                        : "opacity-45"
                    }`}
                  >
                    <span className="text-sm block">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delay field for "Retard" */}
          {isRetard && (
            <div>
              <Label htmlFor="delay" className="text-xs">
                Minutes de retard
              </Label>
              <Input
                id="delay"
                type="number"
                inputMode="numeric"
                placeholder="Ex : 10"
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(e.target.value)}
                min={1}
                max={120}
              />
            </div>
          )}

          <div>
            <Label htmlFor="text" className="text-xs">
              Rappel
            </Label>
            <Input
              id="text"
              placeholder="Saisir le rappel..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dueDate" className="text-xs">
              Échéance (optionnel)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full shrink-0"
          >
            {loading
              ? "Enregistrement..."
              : isMultiStudent
                ? `Enregistrer et continuer (${selectedStudents.length} élèves)`
                : "Enregistrer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
