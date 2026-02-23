"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { SearchableStudent } from "@/types";
import { Input } from "@/components/ui/input";

interface StudentSearchProps {
  onSelect: (students: SearchableStudent[]) => void;
  selectedStudents: SearchableStudent[];
  editMode?: boolean;
}

export function StudentSearch({
  onSelect,
  selectedStudents,
  editMode,
}: StudentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchStudents = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `/api/search/students?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowResults(true);
        }
      } catch (error) {
        console.error("Error searching students:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(
      () => searchStudents(query),
      200
    );
    return () => clearTimeout(timer);
  }, [query, searchStudents]);

  const handleSelect = (student: SearchableStudent) => {
    // Don't add if already selected
    if (selectedStudents.some((s) => s.id === student.id)) return;
    onSelect([...selectedStudents, student]);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleRemove = (studentId: string) => {
    onSelect(selectedStudents.filter((s) => s.id !== studentId));
  };

  if (editMode) return null;

  // Filter out already-selected students from results
  const filteredResults = results.filter(
    (r) => !selectedStudents.some((s) => s.id === r.id)
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-4 h-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
        <Input
          placeholder="Chercher un élève..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() =>
            query.trim() && setShowResults(true)
          }
          className="pl-9"
        />
      </div>

      {/* Selected students badges */}
      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {selectedStudents.map((student) => {
            const genderColor =
              student.gender === "F"
                ? "bg-pink-400"
                : student.gender === "M"
                  ? "bg-blue-400"
                  : null;
            return (
              <span
                key={student.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary rounded-full text-xs font-medium"
              >
                {genderColor && (
                  <span className={`w-1.5 h-1.5 rounded-full ${genderColor}`} />
                )}
                {student.firstName} {student.lastName.charAt(0)}.
                <button
                  type="button"
                  onClick={() => handleRemove(student.id)}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border shadow-lg z-10 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Recherche...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              {results.length > 0
                ? "Tous les résultats sont déjà sélectionnés"
                : "Aucun élève trouvé"}
            </div>
          ) : (
            filteredResults.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => handleSelect(student)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `var(--color-class-${student.classColor})`,
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {student.lastName}{" "}
                    {student.firstName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {student.className}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
