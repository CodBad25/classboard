"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { SearchableStudent } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StudentSearchProps {
  onSelect: (student: SearchableStudent | null) => void;
  selectedStudent: SearchableStudent | null;
}

export function StudentSearch({
  onSelect,
  selectedStudent,
}: StudentSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchableStudent[]>(
    []
  );
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
    onSelect(student);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleDeselect = () => {
    onSelect(null);
    setQuery("");
    setResults([]);
  };

  if (selectedStudent) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {selectedStudent.lastName}{" "}
            {selectedStudent.firstName}
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedStudent.className}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDeselect}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

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
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border shadow-lg z-10 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Recherche...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Aucun élève trouvé
            </div>
          ) : (
            results.map((student) => (
              <button
                key={student.id}
                onClick={() =>
                  handleSelect(student)
                }
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
