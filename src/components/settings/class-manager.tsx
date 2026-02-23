"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Class, SchoolYear } from "@/types";

const CLASS_COLORS = ["blue", "cyan", "green", "lime", "purple"] as const;

const CLASS_COLOR_MAP: Record<string, string> = {
  blue: "bg-class-blue",
  cyan: "bg-class-cyan",
  green: "bg-class-green",
  lime: "bg-class-lime",
  purple: "bg-class-purple",
};

const CLASS_COLOR_LABELS: Record<string, string> = {
  blue: "Bleu",
  cyan: "Cyan",
  green: "Vert",
  lime: "Lime",
  purple: "Violet",
};

export function ClassManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState<typeof CLASS_COLORS[number]>("blue");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentYear();
  }, []);

  useEffect(() => {
    if (currentYear) {
      fetchClasses();
    }
  }, [currentYear]);

  const fetchCurrentYear = async () => {
    try {
      const res = await fetch("/api/school-years");
      const data = await res.json();
      const current = data.find((y: SchoolYear) => y.isCurrent);
      setCurrentYear(current || null);
    } catch (error) {
      console.error("Error fetching current year:", error);
      toast.error("Erreur lors du chargement de l'année");
    }
  };

  const fetchClasses = async () => {
    if (!currentYear) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/classes?yearId=${currentYear.id}`);
      const data = await res.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async () => {
    if (!newName.trim()) {
      toast.error("Veuillez entrer un nom de classe");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/classes/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName, color: selectedColor }),
        });

        if (!res.ok) throw new Error("Failed to update class");
        toast.success("Classe modifiée");
      } else {
        if (!currentYear) {
          toast.error("Aucune année courante");
          return;
        }

        const res = await fetch("/api/classes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            schoolYearId: currentYear.id,
            name: newName,
            color: selectedColor,
          }),
        });

        if (!res.ok) throw new Error("Failed to create class");
        toast.success("Classe ajoutée");
      }

      await fetchClasses();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'opération");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/classes/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete class");

      await fetchClasses();
      setShowDeleteDialog(false);
      setDeleteId(null);
      toast.success("Classe supprimée");
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewName("");
    setSelectedColor("blue");
  };

  const startEdit = (cls: Class) => {
    setEditingId(cls.id);
    setNewName(cls.name);
    setSelectedColor(cls.color as typeof CLASS_COLORS[number]);
    setShowForm(true);
  };

  if (!currentYear) {
    return (
      <div className="text-muted-foreground text-sm">
        Veuillez créer une année scolaire d'abord
      </div>
    );
  }

  if (loading) {
    return <div className="text-muted-foreground text-sm">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Classes List */}
      {classes.length > 0 && (
        <div className="flex flex-col gap-2">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30 border border-border"
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  CLASS_COLOR_MAP[cls.color] || "bg-muted"
                }`}
              />
              <span className="flex-1 text-sm font-medium">{cls.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => startEdit(cls)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setDeleteId(cls.id);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm ? (
        <div className="flex flex-col gap-3 p-3 rounded-md bg-muted/20 border border-border">
          <Input
            type="text"
            placeholder="Nom de la classe"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddOrEdit();
              if (e.key === "Escape") resetForm();
            }}
          />

          {/* Color Picker */}
          <div className="flex flex-wrap gap-2">
            {CLASS_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  CLASS_COLOR_MAP[color]
                } ${
                  selectedColor === color
                    ? "border-primary scale-110"
                    : "border-border"
                }`}
                title={CLASS_COLOR_LABELS[color]}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={resetForm}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddOrEdit}
              disabled={!newName.trim()}
            >
              {editingId ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-fit"
        >
          <Plus className="size-4" />
          Ajouter une classe
        </Button>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la classe ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Cette action supprimera la classe et tous les élèves associés.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
