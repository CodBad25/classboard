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
import type { ReminderCategory } from "@/types";

const COLORS = ["red", "amber", "blue", "orange", "purple", "slate"] as const;

const COLOR_LABELS: Record<string, string> = {
  red: "Rouge",
  amber: "Ambre",
  blue: "Bleu",
  orange: "Orange",
  purple: "Violet",
  slate: "Gris",
};

const EMOJI_OPTIONS = [
  "🚫", "⏰", "🎒", "✉️", "⚠️", "📝", "📌",
  "📚", "✏️", "🔔", "💬", "❌", "✅", "⭐",
  "🏃", "🤝", "📎", "🗓️", "💡", "🔑",
];

export function CategoryManager() {
  const [categories, setCategories] = useState<ReminderCategory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [selectedColor, setSelectedColor] = useState<typeof COLORS[number]>("red");
  const [selectedIcon, setSelectedIcon] = useState("📌");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrEdit = async () => {
    if (!newLabel.trim()) {
      toast.error("Veuillez entrer un libellé");
      return;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/categories/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: newLabel,
            color: selectedColor,
            icon: selectedIcon,
          }),
        });
        if (!res.ok) throw new Error("Failed to update category");
        toast.success("Catégorie modifiée");
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: newLabel,
            color: selectedColor,
            icon: selectedIcon,
          }),
        });
        if (!res.ok) throw new Error("Failed to create category");
        toast.success("Catégorie ajoutée");
      }

      await fetchCategories();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'opération");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/categories/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      await fetchCategories();
      setShowDeleteDialog(false);
      setDeleteId(null);
      toast.success("Catégorie supprimée");
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewLabel("");
    setSelectedColor("red");
    setSelectedIcon("📌");
  };

  const startEdit = (cat: ReminderCategory) => {
    setEditingId(cat.id);
    setNewLabel(cat.label);
    setSelectedColor(cat.color as typeof COLORS[number]);
    setSelectedIcon(cat.icon);
    setShowForm(true);
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Categories List */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border"
              style={{
                backgroundColor: `var(--color-cat-${cat.color}-bg)`,
                borderColor: `color-mix(in oklch, var(--color-cat-${cat.color}) 30%, transparent)`,
              }}
            >
              <span className="text-base">{cat.icon}</span>
              <span
                className="text-sm font-medium flex-1"
                style={{ color: `var(--color-cat-${cat.color})` }}
              >
                {cat.label}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => startEdit(cat)}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setDeleteId(cat.id);
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
            placeholder="Libellé de la catégorie"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") resetForm();
            }}
          />

          {/* Emoji Picker */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Emoji :</div>
            <div className="grid grid-cols-10 gap-1 mb-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedIcon(emoji)}
                  className={`text-lg p-1 rounded-md transition-all ${
                    selectedIcon === emoji
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Ou tape un emoji ici..."
              value={selectedIcon}
              onChange={(e) => {
                const val = e.target.value;
                if (val) setSelectedIcon(val.slice(-2));
              }}
              className="text-center text-lg h-9 w-20"
            />
          </div>

          {/* Color Picker */}
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Couleur :</div>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? "border-foreground scale-110"
                      : "border-transparent"
                  }`}
                  style={{
                    backgroundColor: `var(--color-cat-${color})`,
                  }}
                  title={COLOR_LABELS[color]}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold"
            style={{
              backgroundColor: `var(--color-cat-${selectedColor}-bg)`,
              color: `var(--color-cat-${selectedColor})`,
            }}
          >
            <span className="text-base">{selectedIcon}</span>
            {newLabel || "Aperçu"}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddOrEdit}
              disabled={!newLabel.trim()}
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
          Ajouter une catégorie
        </Button>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Les rappels existants ne seront pas supprimés, mais leur catégorie sera vide.
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
