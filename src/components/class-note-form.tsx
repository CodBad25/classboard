"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ClassNote } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClassNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  editNote?: ClassNote | null;
  onSaved: () => void;
}

export function ClassNoteForm({
  open,
  onOpenChange,
  classId,
  editNote,
  onSaved,
}: ClassNoteFormProps) {
  const [text, setText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editNote) {
        setText(editNote.text);
        setIsPinned(editNote.isPinned);
      } else {
        setText("");
        setIsPinned(false);
      }
    }
  }, [open, editNote]);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error(
        "Le texte de la note est requis"
      );
      return;
    }

    setLoading(true);
    try {
      const url = editNote
        ? `/api/class-notes/${editNote.id}`
        : "/api/class-notes";

      const method = editNote ? "PATCH" : "POST";

      const payload = {
        classId: classId || "",
        text,
        isPinned,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(
          editNote ? "Note modifiée" : "Note créée"
        );
        onSaved();
        onOpenChange(false);
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[90vh] rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle>
            {editNote ? "Modifier la note" : "Nouvelle note"}
          </SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 mt-4"
        >
          <div>
            <Label htmlFor="text" className="text-xs">
              Note
            </Label>
            <Textarea
              id="text"
              placeholder="Saisir la note..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) =>
                setIsPinned(e.target.checked)
              }
              className="w-4 h-4 rounded cursor-pointer"
            />
            <Label
              htmlFor="isPinned"
              className="text-xs cursor-pointer"
            >
              Épingler cette note
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? "Enregistrement..."
              : "Enregistrer"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
