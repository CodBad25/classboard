import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import {
  students,
  reminders,
  classNotes,
  classes,
  reminderCategories,
} from "../../../../../drizzle/schema";
import { eq, inArray, like } from "drizzle-orm";

const REMINDER_TEXTS = [
  "Mot à signer dans le carnet",
  "Devoir non rendu : exercice 3 p.45",
  "Punition : copier la leçon 2 fois",
  "Rattrapage contrôle du 15/02",
  "Apporter le matériel de géométrie",
  "Comportement perturbateur en classe",
  "Oubli du cahier de textes",
  "Retard non justifié",
  "Devoir non fait : fiche de révision",
  "Mot aux parents : sortie scolaire",
  "Apporter la colle et les ciseaux",
  "Punition : recopier les règles de vie",
  "Rattrapage évaluation de grammaire",
  "Oubli répété du livre de français",
  "Bavardages excessifs en cours",
];

const CLASS_NOTE_TEXTS = [
  "Contrôle prévu vendredi prochain sur le chapitre 4",
  "Ramasser les autorisations de sortie",
  "Préparer les copies pour l'évaluation",
  "Rappeler : pas de cours lundi (férié)",
  "Distribuer les bulletins de mi-trimestre",
  "Changement de salle : passer en B204",
  "Projet en groupe à lancer la semaine prochaine",
  "Vérifier les cahiers de correspondance",
];

const SEED_TAG = "[TEST]";

function randomDate(daysBack: number, daysForward: number): string {
  const now = Date.now();
  const offset =
    (Math.random() * (daysBack + daysForward) - daysBack) * 86400000;
  const d = new Date(now + offset);
  return d.toISOString().split("T")[0];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST() {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    // Get all classes and categories
    const allClasses = await db.select().from(classes);
    const allCategories = await db.select().from(reminderCategories);

    if (allClasses.length === 0) {
      return NextResponse.json(
        { error: "Créez d'abord des classes dans les réglages" },
        { status: 400 }
      );
    }

    // Get all students across all classes
    const allStudents = await db.select().from(students);

    if (allStudents.length === 0) {
      return NextResponse.json(
        { error: "Importez d'abord des élèves dans les réglages" },
        { status: 400 }
      );
    }

    const newReminders = [];
    const newNotes = [];

    // Generate 2-5 reminders per class, picking random students
    for (const cls of allClasses) {
      const classStudents = allStudents.filter((s) => s.classId === cls.id);
      if (classStudents.length === 0) continue;

      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const student = pick(classStudents);
        const hasDue = Math.random() > 0.4;
        const isDone = Math.random() > 0.7;
        newReminders.push({
          id: randomUUID(),
          studentId: student.id,
          categoryId:
            allCategories.length > 0 ? pick(allCategories).id : null,
          text: `${SEED_TAG} ${pick(REMINDER_TEXTS)}`,
          dueDate: hasDue ? randomDate(5, 10) : null,
          isDone,
          doneAt: isDone ? new Date() : null,
        });
      }

      // 1-2 class notes per class
      const noteCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < noteCount; i++) {
        newNotes.push({
          id: randomUUID(),
          classId: cls.id,
          text: `${SEED_TAG} ${pick(CLASS_NOTE_TEXTS)}`,
          isPinned: Math.random() > 0.7,
        });
      }
    }

    if (newReminders.length > 0) {
      await db.insert(reminders).values(newReminders);
    }
    if (newNotes.length > 0) {
      await db.insert(classNotes).values(newNotes);
    }

    return NextResponse.json({
      reminders: newReminders.length,
      notes: newNotes.length,
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    if (!db) throw new Error("Database not available");

    // Delete all reminders and notes tagged with [TEST]
    const allReminders = await db.select().from(reminders);
    const testReminderIds = allReminders
      .filter((r) => r.text.startsWith(SEED_TAG))
      .map((r) => r.id);

    const allNotes = await db.select().from(classNotes);
    const testNoteIds = allNotes
      .filter((n) => n.text.startsWith(SEED_TAG))
      .map((n) => n.id);

    let deletedReminders = 0;
    let deletedNotes = 0;

    if (testReminderIds.length > 0) {
      await db.delete(reminders).where(inArray(reminders.id, testReminderIds));
      deletedReminders = testReminderIds.length;
    }

    if (testNoteIds.length > 0) {
      await db.delete(classNotes).where(inArray(classNotes.id, testNoteIds));
      deletedNotes = testNoteIds.length;
    }

    return NextResponse.json({
      deletedReminders,
      deletedNotes,
    });
  } catch (error) {
    console.error("Error cleaning seed data:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
