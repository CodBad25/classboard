"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
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
import { CsvImport } from "./csv-import";
import type { Class, Student, SchoolYear } from "@/types";

export function StudentManager() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentYear, setCurrentYear] = useState<SchoolYear | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentYear();
  }, []);

  useEffect(() => {
    if (currentYear) {
      fetchClasses();
    }
  }, [currentYear]);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    } else {
      setStudents([]);
    }
  }, [selectedClassId]);

  const fetchCurrentYear = async () => {
    try {
      const res = await fetch("/api/school-years");
      const data = await res.json();
      const current = data.find((y: SchoolYear) => y.isCurrent);
      setCurrentYear(current || null);
    } catch (error) {
      console.error("Error fetching current year:", error);
      toast.error("Erreur lors du chargement de l'année");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (!currentYear) return;
    try {
      const res = await fetch(`/api/classes?yearId=${currentYear.id}`);
      const data = await res.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erreur lors du chargement des classes");
    }
  };

  const fetchStudents = async () => {
    if (!selectedClassId) return;
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data = await res.json();
      const sorted = data.sort((a: Student, b: Student) =>
        `${a.lastName} ${a.firstName}`.localeCompare(
          `${b.lastName} ${b.firstName}`
        )
      );
      setStudents(sorted);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Erreur lors du chargement des élèves");
    }
  };

  const handleAddStudent = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Veuillez entrer le prénom et le nom");
      return;
    }

    if (!selectedClassId) {
      toast.error("Veuillez sélectionner une classe");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClassId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create student");

      await fetchStudents();
      setFirstName("");
      setLastName("");
      setShowForm(false);
      toast.success("Élève ajouté");
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Erreur lors de l'ajout");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/students/${deleteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete student");

      await fetchStudents();
      setShowDeleteDialog(false);
      setDeleteId(null);
      toast.success("Élève supprimé");
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Chargement...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        Veuillez créer des classes d'abord
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Class Selector */}
      <div className="flex flex-wrap gap-2">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
              selectedClassId === cls.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:bg-muted/30"
            }`}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Students List */}
      {students.length > 0 && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className={`flex items-center justify-between px-3 py-2 rounded-md border ${
                student.gender === "F"
                  ? "bg-pink-500/8 border-pink-500/20"
                  : student.gender === "M"
                    ? "bg-blue-500/8 border-blue-500/20"
                    : "bg-muted/30 border-border"
              }`}
            >
              <span className="text-sm flex items-center gap-2">
                {student.gender && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      student.gender === "F" ? "bg-pink-400" : "bg-blue-400"
                    }`}
                  />
                )}
                {student.lastName} {student.firstName}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setDeleteId(student.id);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {showForm ? (
        <div className="flex flex-col gap-3 p-3 rounded-md bg-muted/20 border border-border">
          <Input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowForm(false);
                setFirstName("");
                setLastName("");
              }
            }}
          />
          <Input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddStudent();
              if (e.key === "Escape") {
                setShowForm(false);
                setFirstName("");
                setLastName("");
              }
            }}
          />

          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setFirstName("");
                setLastName("");
              }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddStudent}
              disabled={!firstName.trim() || !lastName.trim()}
            >
              Ajouter
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="flex-1"
          >
            <Plus className="size-4" />
            Ajouter un élève
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCsvImport(true)}
            className="flex-1"
          >
            <Upload className="size-4" />
            Importer CSV
          </Button>
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvImport && selectedClassId && (
        <CsvImport
          classId={selectedClassId}
          onImported={() => {
            fetchStudents();
            setShowCsvImport(false);
            toast.success("Élèves importés");
          }}
        />
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'élève ?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Les rappels associés à cet élève seront conservés.
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
