"use client";

import { useState, useEffect } from "react";
import { Header, type HeaderTabId } from "@/components/header";
import { ClassChips } from "@/components/class-chips";
import { ReminderList } from "@/components/reminder-list";
import { ClassNotesList } from "@/components/class-notes-list";
import { FabButton } from "@/components/fab-button";
import { DashboardConnexions } from "@/components/dashboard-connexions";
import { ClassData } from "@/types";
import { toast } from "sonner";

export default function Home() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<HeaderTabId>("connexions");
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const res = await fetch("/api/classes/current");
      if (res.ok) {
        const { classes, pendingCounts } = await res.json();
        setClasses(classes);
        setPendingCounts(pendingCounts);

        if (classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classes[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erreur lors du chargement des classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const pendingCount =
    selectedClassId && pendingCounts[selectedClassId]
      ? pendingCounts[selectedClassId]
      : 0;

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background text-foreground">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingCount={pendingCount}
      />

      {activeTab !== "connexions" && (
        <ClassChips
          classes={classes}
          selectedId={selectedClassId}
          pendingCounts={pendingCounts}
          onSelect={setSelectedClassId}
        />
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "reminders" && (
          <ReminderList classId={selectedClassId} onCountChange={fetchClasses} />
        )}
        {activeTab === "notes" && <ClassNotesList classId={selectedClassId} />}
        {activeTab === "connexions" && <DashboardConnexions />}
      </div>

      {activeTab !== "connexions" && (
        <FabButton
          activeTab={activeTab as "reminders" | "notes"}
          classId={selectedClassId}
          onCreated={fetchClasses}
        />
      )}
    </div>
  );
}
