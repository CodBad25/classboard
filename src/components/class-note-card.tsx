"use client";

import { Pin, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ClassNote } from "@/types";
import { Button } from "@/components/ui/button";

interface ClassNoteCardProps {
  note: ClassNote;
  onTogglePin: (id: string) => void;
  onEdit: (note: ClassNote) => void;
  onDelete: (id: string) => void;
}

export function ClassNoteCard({
  note,
  onTogglePin,
  onEdit,
  onDelete,
}: ClassNoteCardProps) {
  return (
    <div
      className={`p-3 bg-card rounded-xl ${
        note.isPinned
          ? "border-l-4 border-amber-500"
          : ""
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm flex-1 whitespace-pre-wrap">
          {note.text}
        </p>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onTogglePin(note.id)}
            className="h-8 w-8"
          >
            <Pin
              className={`w-4 h-4 ${
                note.isPinned
                  ? "text-amber-500 fill-amber-500"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(note.id)}
            className="h-8 w-8"
          >
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2 block">
        {format(parseISO(note.createdAt), "d MMM HH:mm", {
          locale: fr,
        })}
      </span>
    </div>
  );
}
