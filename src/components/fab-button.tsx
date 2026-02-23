"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderForm } from "./reminder-form";
import { ClassNoteForm } from "./class-note-form";

interface FabButtonProps {
  activeTab: "reminders" | "notes";
  classId: string | null;
  onCreated: () => void;
}

export function FabButton({
  activeTab,
  classId,
  onCreated,
}: FabButtonProps) {
  const [reminderFormOpen, setReminderFormOpen] =
    useState(false);
  const [noteFormOpen, setNoteFormOpen] =
    useState(false);

  return (
    <>
      <Button
        onClick={() => {
          if (activeTab === "reminders") {
            setReminderFormOpen(true);
          } else {
            setNoteFormOpen(true);
          }
        }}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center z-50"
      >
        <Plus className="w-6 h-6" />
      </Button>

      <ReminderForm
        open={reminderFormOpen}
        onOpenChange={setReminderFormOpen}
        classId={classId}
        onSaved={onCreated}
      />

      <ClassNoteForm
        open={noteFormOpen}
        onOpenChange={setNoteFormOpen}
        classId={classId}
        onSaved={onCreated}
      />
    </>
  );
}
