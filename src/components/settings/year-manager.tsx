"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { SchoolYear } from "@/types";

export function YearManager() {
  const [years, setYears] = useState<SchoolYear[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/school-years");
      const data = await res.json();
      setYears(data);
      const current = data.find((y: SchoolYear) => y.isCurrent);
      setCurrentYear(current || null);
    } catch (error) {
      console.error("Error fetching years:", error);
      toast.error("Erreur lors du chargement des années");
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = async () => {
    if (!newLabel.trim()) {
      toast.error("Veuillez entrer un libellé");
      return;
    }

    try {
      // S'il n'y a aucune année courante, la nouvelle le devient : sinon
      // l'application resterait sans année active. Si une année est déjà
      // courante, on ne bascule pas dans le dos de l'utilisateur.
      const becomesCurrent = !currentYear;

      const res = await fetch("/api/school-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel, isCurrent: becomesCurrent }),
      });

      if (!res.ok) throw new Error("Failed to create year");

      await fetchYears();
      setNewLabel("");
      setShowForm(false);
      toast.success(
        becomesCurrent
          ? "Année ajoutée et définie comme courante"
          : "Année ajoutée — pensez à la définir comme courante"
      );
    } catch (error) {
      console.error("Error adding year:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleSetCurrent = async (yearId: string) => {
    try {
      const res = await fetch(`/api/school-years/${yearId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCurrent: true }),
      });

      if (!res.ok) throw new Error("Failed to update year");

      await fetchYears();
      toast.success("Année courante mise à jour");
    } catch (error) {
      console.error("Error updating year:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Chargement...</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Current Year Badge */}
      {currentYear && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Année courante :</span>
          <Badge variant="default">{currentYear.label}</Badge>
        </div>
      )}

      {/* Years List */}
      <div className="flex flex-col gap-2">
        {years.map((year) => (
          <button
            key={year.id}
            onClick={() => handleSetCurrent(year.id)}
            className={`px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
              year.isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-muted/30"
            }`}
          >
            {year.label}
          </button>
        ))}
      </div>

      {/* Add Form */}
      {showForm ? (
        <div className="flex gap-2 items-end">
          <Input
            type="text"
            placeholder="Ex: 2025-2026"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddYear();
              if (e.key === "Escape") {
                setShowForm(false);
                setNewLabel("");
              }
            }}
          />
          <Button size="sm" onClick={handleAddYear} disabled={!newLabel.trim()}>
            Ajouter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setNewLabel("");
            }}
          >
            Annuler
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(true)}
          className="w-fit"
        >
          <Plus className="size-4" />
          Ajouter une année
        </Button>
      )}
    </div>
  );
}
