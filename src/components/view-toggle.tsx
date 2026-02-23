"use client";

import { Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  value: "by-student" | "chronological";
  onChange: (value: "by-student" | "chronological") => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-2 px-4 py-3">
      <Button
        variant={value === "by-student" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("by-student")}
        className="flex items-center gap-2"
      >
        <Users className="w-4 h-4" />
        Par élève
      </Button>
      <Button
        variant={
          value === "chronological" ? "default" : "ghost"
        }
        size="sm"
        onClick={() => onChange("chronological")}
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Chronologique
      </Button>
    </div>
  );
}
