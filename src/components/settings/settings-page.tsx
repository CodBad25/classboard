"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ArrowLeft, Sun, Moon, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { YearManager } from "./year-manager";
import { ClassManager } from "./class-manager";
import { CategoryManager } from "./category-manager";
import { StudentManager } from "./student-manager";

export function SettingsPage() {
  const [openSection, setOpenSection] = useState<string | null>("year");
  const [seeding, setSeeding] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch("/api/dev/seed", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erreur");
        return;
      }
      const data = await res.json();
      toast.success(`${data.reminders} rappels + ${data.notes} notes créés`);
    } catch {
      toast.error("Erreur lors de la génération");
    } finally {
      setSeeding(false);
    }
  };

  const handleCleanSeed = async () => {
    try {
      setCleaning(true);
      const res = await fetch("/api/dev/seed", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(
        `${data.deletedReminders} rappels + ${data.deletedNotes} notes supprimés`
      );
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setCleaning(false);
    }
  };

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-semibold flex-1">Réglages</h1>
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="shrink-0"
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4 p-4 pb-safe max-w-2xl mx-auto">
        {/* Year Section */}
        <Section
          title="Année scolaire"
          expanded={openSection === "year"}
          onToggle={() => toggleSection("year")}
        >
          <YearManager />
        </Section>

        {/* Class Section */}
        <Section
          title="Classes"
          expanded={openSection === "class"}
          onToggle={() => toggleSection("class")}
        >
          <ClassManager />
        </Section>

        {/* Category Section */}
        <Section
          title="Catégories de rappels"
          expanded={openSection === "category"}
          onToggle={() => toggleSection("category")}
        >
          <CategoryManager />
        </Section>

        {/* Student Section */}
        <Section
          title="Élèves"
          expanded={openSection === "student"}
          onToggle={() => toggleSection("student")}
        >
          <StudentManager />
        </Section>

        {/* Dev Section */}
        <Section
          title="Données de test"
          expanded={openSection === "dev"}
          onToggle={() => toggleSection("dev")}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Génère des rappels et notes aléatoires pour tester le rendu.
              Les données de test sont marquées [TEST] et supprimables séparément.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSeed}
                disabled={seeding}
                className="flex-1"
              >
                <Sparkles className="size-4" />
                {seeding ? "Génération..." : "Générer"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCleanSeed}
                disabled={cleaning}
                className="flex-1 text-destructive border-destructive/30"
              >
                <Trash2 className="size-4" />
                {cleaning ? "Suppression..." : "Supprimer [TEST]"}
              </Button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, expanded, onToggle, children }: SectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
      >
        <h2 className="font-semibold">{title}</h2>
        <div
          className={`text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4 bg-background/50 flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  );
}
