// Anonymisation des noms d'élèves — copié du pattern utilisé dans maths-5e / maths-4e / belmathen6eme
// pour garantir des noms identiques cross-sites (hash sur Hub eleveId + mêmes listes).

const MATHEMATICIENS_H = [
  "Leonhard Euler", "Isaac Newton", "Carl Gauss", "Henri Poincaré",
  "Blaise Pascal", "René Descartes", "Pierre Fermat", "Alan Turing",
  "Srinivasa Ramanujan", "David Hilbert", "Bernhard Riemann",
  "Évariste Galois", "Archimède", "Pythagore", "Euclide",
  "Augustin Cauchy", "Joseph Fourier", "Gottfried Leibniz",
  "Georg Cantor", "Kurt Gödel", "John Nash", "Andrew Wiles",
  "Cédric Villani", "Terence Tao", "Niels Abel", "Carl Jacobi",
  "Alexandre Grothendieck", "Jean-Pierre Serre", "Laurent Schwartz", "Gaspard Monge",
];

const MATHEMATICIENS_F = [
  "Sophie Germain", "Emmy Noether", "Ada Lovelace", "Marie Curie",
  "Maryam Mirzakhani", "Karen Uhlenbeck", "Sofia Kowalevski",
  "Maria Agnesi", "Katherine Johnson", "Ingrid Daubechies",
  "Claire Voisin", "Nalini Joshi", "Olga Ladyzhenskaya",
  "Hélène Esnault", "Laure Saint-Raymond", "Ariane Mézard",
  "Julia Robinson", "Florence Nightingale", "Hypatia",
  "Émilie du Châtelet", "Mary Cartwright", "Ruth Moufang",
  "Marina Ratner", "Nicole El Karoui", "Yvonne Choquet-Bruhat",
  "Paulette Libermann", "Cécile DeWitt-Morette", "Alice Roth",
  "Daina Taimina", "Maryna Viazovska",
];

export interface MinimalStudent {
  eleveId: string;
  prenom: string;
  nom: string;
}

let _anonMap: Record<string, string> = {};
let _anonActive = false;
const _listeners = new Set<() => void>();

function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function guessFemale(prenom: string): boolean {
  const p = prenom.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (p.endsWith("a") || p.endsWith("ine") || p.endsWith("elle") || p.endsWith("ette") || p.endsWith("ise") || p.endsWith("ane") || p.endsWith("ie")) return true;
  const masculins = ["luca", "joshua", "andrea", "noa", "mika", "issa", "moussa", "alpha", "mustafa", "nikola"];
  if (masculins.includes(p)) return false;
  const feminins = ["manon", "margot", "chloe", "lison", "romane", "cathy", "linna", "luna", "alice", "lucie", "marie", "julie", "lea", "chloe", "emma", "sarah", "camille"];
  if (feminins.includes(p)) return true;
  if (p.endsWith("e") && !p.endsWith("me") && !p.endsWith("re") && !p.endsWith("ce") && !p.endsWith("ne") && !p.endsWith("sse")) return true;
  return false;
}

export function isAnonymized(): boolean { return _anonActive; }

export function subscribeAnonymize(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}

function notify(): void {
  _listeners.forEach((fn) => fn());
}

function buildMap(students: MinimalStudent[]): void {
  const sorted = [...students].sort((a, b) => a.eleveId.localeCompare(b.eleveId));
  const usedNames = new Set<string>();
  for (const s of sorted) {
    if (_anonMap[s.eleveId]) continue;
    const isFemale = guessFemale(s.prenom);
    const primary = isFemale ? MATHEMATICIENS_F : MATHEMATICIENS_H;
    const fallback = isFemale ? MATHEMATICIENS_H : MATHEMATICIENS_F;
    const hash = hashId(s.eleveId);
    let assigned = "";
    for (let i = 0; i < primary.length && !assigned; i++) {
      const c = primary[(hash + i) % primary.length];
      if (!usedNames.has(c)) assigned = c;
    }
    if (!assigned) {
      for (let i = 0; i < fallback.length && !assigned; i++) {
        const c = fallback[(hash + i) % fallback.length];
        if (!usedNames.has(c)) assigned = c;
      }
    }
    if (assigned) {
      usedNames.add(assigned);
      _anonMap[s.eleveId] = assigned;
    }
  }
}

export function toggleAnonymize(students: MinimalStudent[]): boolean {
  _anonActive = !_anonActive;
  if (_anonActive) buildMap(students);
  notify();
  return _anonActive;
}

export function resetAnonymize(): void {
  _anonMap = {};
  _anonActive = false;
  notify();
}

export function anonName(student: MinimalStudent): string {
  if (!_anonActive) return `${student.prenom} ${student.nom}`;
  return _anonMap[student.eleveId] || `${student.prenom} ${student.nom}`;
}

export function anonShort(student: MinimalStudent): string {
  if (!_anonActive) return `${student.prenom} ${student.nom.charAt(0)}.`;
  const name = _anonMap[student.eleveId];
  if (!name) return `${student.prenom} ${student.nom.charAt(0)}.`;
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1].charAt(0)}.` : name;
}
