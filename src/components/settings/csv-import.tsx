"use client";

import { useRef, useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CsvImportProps {
  classId: string;
  onImported: () => void;
}

interface ParsedStudent {
  firstName: string;
  lastName: string;
  gender: string | null;
}

/**
 * Lit un fichier en essayant UTF-8 d'abord, puis Latin-1 (ISO-8859-1)
 * si des caractères corrompus sont détectés (remplacement char U+FFFD).
 */
async function readFileWithEncoding(file: File): Promise<string> {
  // Essai 1 : UTF-8
  const utf8 = await file.text();
  // Si pas de caractère de remplacement, c'est du bon UTF-8
  if (!utf8.includes("\uFFFD")) {
    return utf8;
  }

  // Essai 2 : Latin-1 (ISO-8859-1) — encodage courant des exports Pronote/Windows
  const buffer = await file.arrayBuffer();
  const latin1 = new TextDecoder("iso-8859-1").decode(buffer);
  return latin1;
}

/**
 * Supprime le BOM (Byte Order Mark) que Windows ajoute parfois en début de fichier.
 */
function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/**
 * Nettoie une cellule CSV : supprime les guillemets englobants et les espaces.
 */
function cleanCell(cell: string): string {
  let s = cell.trim();
  // Guillemets doubles englobants : "valeur" → valeur
  if (s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"') {
    s = s.slice(1, -1).replace(/""/g, '"');
  }
  return s.trim();
}

/**
 * Détecte le séparateur du CSV en comptant les occurrences dans la première ligne.
 */
function detectSeparator(firstLine: string): string {
  const counts = {
    ";": (firstLine.match(/;/g) || []).length,
    ",": (firstLine.match(/,/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
  };
  // Celui qui apparaît le plus est probablement le séparateur
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ";";
}

/**
 * Normalise un texte pour la comparaison : minuscule, sans accents, sans espaces.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime les diacritiques
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Trouve l'index d'une colonne NOM ou PRENOM dans le header.
 */
function findColumnIndex(
  headers: string[],
  patterns: string[]
): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(headers[i]);
    for (const pattern of patterns) {
      if (h === pattern || h.includes(pattern)) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Met en forme un prénom : première lettre majuscule, reste minuscule.
 * Gère les prénoms composés (Jean-Pierre, Marie Anne).
 */
function formatName(name: string, isLastName: boolean): string {
  if (!name) return "";
  if (isLastName) return name.toUpperCase();
  return name
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(name.includes("-") ? "-" : " ");
}

export function CsvImport({ classId, onImported }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewStudents, setPreviewStudents] = useState<ParsedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Ouvrir directement le file picker au montage
  useEffect(() => {
    // Petit délai pour que le ref soit prêt
    const timer = setTimeout(() => fileInputRef.current?.click(), 100);
    return () => clearTimeout(timer);
  }, []);

  const parseCsv = (content: string): ParsedStudent[] => {
    const clean = stripBom(content);
    const lines = clean.split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error("Fichier vide ou une seule ligne");
    }

    const separator = detectSeparator(lines[0]);
    const headers = lines[0].split(separator).map(cleanCell);

    // Chercher les colonnes NOM et PRENOM (avec et sans accents)
    const nomIndex = findColumnIndex(headers, [
      "nom",
      "nomeleve",
      "nomdeleve",
      "nomdefamille",
      "lastname",
      "last_name",
      "name",
    ]);

    const prenomIndex = findColumnIndex(headers, [
      "prenom",
      "prenomeleve",
      "prenomdeleve",
      "firstname",
      "first_name",
    ]);

    const genderIndex = findColumnIndex(headers, [
      "sexe",
      "genre",
      "gender",
      "sex",
      "civilite",
    ]);

    // Info de debug pour l'utilisateur
    const info = `Séparateur: "${separator === "\t" ? "tab" : separator}" | Colonnes: [${headers.join(", ")}] | NOM: col ${nomIndex} | PRÉNOM: col ${prenomIndex} | SEXE: col ${genderIndex}`;
    setDebugInfo(info);

    if (nomIndex === -1 && prenomIndex === -1) {
      // Fallback : si pas de header reconnu, essayer col 0 = nom, col 1 = prénom
      if (headers.length >= 2) {
        const students: ParsedStudent[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cells = line.split(separator).map(cleanCell);
          const col0 = cells[0] || "";
          const col1 = cells[1] || "";
          if (col0 && col1) {
            students.push({
              lastName: formatName(col0, true),
              firstName: formatName(col1, false),
              gender: null,
            });
          }
        }
        if (students.length > 0) return students;
      }
      throw new Error(
        `Colonnes NOM et PRÉNOM non trouvées. Colonnes détectées : [${headers.join(", ")}]`
      );
    }

    // Si un seul des deux est trouvé, utiliser l'autre colonne par déduction
    const finalNomIndex = nomIndex !== -1 ? nomIndex : (prenomIndex === 0 ? 1 : 0);
    const finalPrenomIndex = prenomIndex !== -1 ? prenomIndex : (nomIndex === 0 ? 1 : 0);

    const students: ParsedStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cells = line.split(separator).map(cleanCell);
      const lastName = cells[finalNomIndex] || "";
      const firstName = cells[finalPrenomIndex] || "";

      // Détection du genre : M/F, Masculin/Féminin, Garçon/Fille, H/F
      let gender: string | null = null;
      if (genderIndex !== -1) {
        const raw = normalize(cells[genderIndex] || "");
        if (raw === "m" || raw === "masculin" || raw === "garcon" || raw === "h" || raw === "homme" || raw === "boy" || raw === "male") {
          gender = "M";
        } else if (raw === "f" || raw === "feminin" || raw === "fille" || raw === "femme" || raw === "girl" || raw === "female") {
          gender = "F";
        }
      }

      if (lastName.length >= 2 || firstName.length >= 2) {
        students.push({
          lastName: formatName(lastName, true),
          firstName: formatName(firstName, false),
          gender,
        });
      }
    }

    return students;
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileWithEncoding(file);
      const parsed = parseCsv(content);

      if (parsed.length === 0) {
        toast.error("Aucun élève trouvé dans le fichier");
        return;
      }

      // Dédoublonner (même nom + prénom)
      const seen = new Set<string>();
      const unique = parsed.filter((s) => {
        const key = `${s.lastName}|${s.firstName}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setPreviewStudents(unique);
      toast.success(`${unique.length} élève(s) détecté(s)`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la lecture du fichier"
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch("/api/students/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          students: previewStudents,
        }),
      });

      if (!res.ok) throw new Error("Import failed");

      toast.success(`${previewStudents.length} élève(s) importé(s)`);
      onImported();
      setPreviewStudents([]);
      setDebugInfo("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error importing students:", error);
      toast.error("Erreur lors de l'import");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={previewStudents.length > 0}
      onOpenChange={(open) => {
        if (!open) {
          setPreviewStudents([]);
          setDebugInfo("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt,.tsv"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      {previewStudents.length > 0 && (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Aperçu — {previewStudents.length} élève(s)
            </DialogTitle>
          </DialogHeader>

          {debugInfo && (
            <p className="text-[10px] text-muted-foreground font-mono bg-muted/30 p-2 rounded break-all">
              {debugInfo}
            </p>
          )}

          <div className="max-h-64 overflow-y-auto">
            <div className="flex flex-col gap-1">
              {previewStudents.map((student, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 text-sm rounded-md border border-border flex items-center gap-2 ${
                    student.gender === "F"
                      ? "bg-pink-500/10 border-pink-500/20"
                      : student.gender === "M"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-muted/20"
                  }`}
                >
                  {student.gender && (
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        student.gender === "F" ? "bg-pink-400" : "bg-blue-400"
                      }`}
                    />
                  )}
                  <span>
                    <span className="font-semibold">{student.lastName}</span>{" "}
                    {student.firstName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewStudents([]);
                setDebugInfo("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={isProcessing}
            >
              Annuler
            </Button>
            <Button onClick={handleImport} disabled={isProcessing}>
              {isProcessing
                ? "Importation..."
                : `Importer ${previewStudents.length} élève(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
