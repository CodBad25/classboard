"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";
import { ClassNote } from "@/types";
import { ClassNoteCard } from "./class-note-card";
import { ClassNoteForm } from "./class-note-form";

interface ClassNotesListProps {
  classId: string | null;
}

export function ClassNotesList({
  classId,
}: ClassNotesListProps) {
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] =
    useState(false);
  const [editingNote, setEditingNote] =
    useState<ClassNote | null>(null);

  const fetchNotes = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/class-notes?classId=${classId}`
      );
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (error) {
      console.error(
        "Error fetching class notes:",
        error
      );
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [classId]);

  const handleTogglePin = async (id: string) => {
    try {
      const note = notes.find((n) => n.id === id);
      if (!note) return;

      const res = await fetch(
        `/api/class-notes/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isPinned: !note.isPinned,
          }),
        }
      );

      if (res.ok) {
        await fetchNotes();
        toast.success("Note mise à jour");
      }
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `/api/class-notes/${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await fetchNotes();
        toast.success("Note supprimée");
      }
    } catch (error) {
      console.error(
        "Error deleting class note:",
        error
      );
      toast.error("Erreur");
    }
  };

  const handleEdit = (note: ClassNote) => {
    setEditingNote(note);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        Chargement...
      </div>
    );
  }

  // Sort notes: pinned first, then by creation date
  const sortedNotes = [...notes].sort(
    (a, b) => {
      if (a.isPinned === b.isPinned) {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      }
      return a.isPinned ? -1 : 1;
    }
  );

  if (sortedNotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">
          Aucune note pour cette classe
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {sortedNotes.map((note) => (
        <ClassNoteCard
          key={note.id}
          note={note}
          onTogglePin={handleTogglePin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ))}

      <ClassNoteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        classId={classId}
        editNote={editingNote}
        onSaved={() => {
          fetchNotes();
          setEditingNote(null);
        }}
      />
    </div>
  );
}
