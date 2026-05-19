// Matching élèves Hub (Connexions) ↔ élèves ClassBoard (Rappels)
// Les IDs diffèrent : on matche sur prénom + nom + classe normalisés.

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function studentKey(firstName: string, lastName: string, className: string): string {
  const norm = (x: string) => stripAccents(x).toLowerCase().trim().replace(/\s+/g, " ");
  return `${norm(firstName)}|${norm(lastName)}|${norm(className)}`;
}

export interface ReminderLite {
  id: string;
  text: string;
  dueDate: string | null;
  doneAt: string | null;
  categoryLabel: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
}

export interface StudentRemindersEntry {
  studentId: string;
  pendingCount: number;
  doneCount: number;
  pending: ReminderLite[];
  done: ReminderLite[];
}
