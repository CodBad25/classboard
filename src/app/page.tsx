"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { ClassChips } from "@/components/class-chips";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReminderList } from "@/components/reminder-list";
import { ClassNotesList } from "@/components/class-notes-list";
import { FabButton } from "@/components/fab-button";
import { DashboardConnexions } from "@/components/dashboard-connexions";
import { ClassData } from "@/types";
import { toast } from "sonner";

type TabId = "reminders" | "notes" | "connexions";

export default function Home() {
  const [classes, setClasses] = useState<ClassData[]>(
    []
  );
  const [selectedClassId, setSelectedClassId] =
    useState<string | null>(null);
  const [pendingCounts, setPendingCounts] = useState<
    Record<string, number>
  >({});
  const [activeTab, setActiveTab] = useState<TabId>("connexions");
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    try {
      const res = await fetch(
        "/api/classes/current"
      );
      if (res.ok) {
        const { classes, pendingCounts } =
          await res.json();
        setClasses(classes);
        setPendingCounts(pendingCounts);

        if (
          classes.length > 0 &&
          !selectedClassId
        ) {
          setSelectedClassId(classes[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error(
        "Erreur lors du chargement des classes"
      );
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
      <Header />
      {activeTab !== "connexions" && (
        <ClassChips
          classes={classes}
          selectedId={selectedClassId}
          pendingCounts={pendingCounts}
          onSelect={setSelectedClassId}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-3 border border-border/50">
          <TabsTrigger value="reminders">
            📌 Rappels ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="notes">
            📝 Notes
          </TabsTrigger>
          <TabsTrigger value="connexions">
            📊 Connexions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="flex-1 overflow-y-auto">
          <ReminderList
            classId={selectedClassId}
            onCountChange={fetchClasses}
          />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-y-auto">
          <ClassNotesList
            classId={selectedClassId}
          />
        </TabsContent>

        <TabsContent value="connexions" className="flex-1 overflow-y-auto">
          <DashboardConnexions />
        </TabsContent>
      </Tabs>

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
