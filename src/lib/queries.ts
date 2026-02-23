import { eq, and, asc, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  schoolYears,
  classes,
  students,
  reminderCategories,
  reminders,
  classNotes,
  type SchoolYear,
  type Class,
  type Student,
  type ReminderCategory,
  type Reminder,
  type ClassNote,
  type InsertSchoolYear,
  type InsertClass,
  type InsertStudent,
  type InsertReminderCategory,
  type InsertReminder,
  type InsertClassNote,
} from "../../drizzle/schema";

// ========== School Years ==========

export async function getSchoolYears(): Promise<SchoolYear[]> {
  const db = getDb();
  if (!db) return [];
  return db.select().from(schoolYears).orderBy(desc(schoolYears.label));
}

export async function getCurrentSchoolYear(): Promise<SchoolYear | null> {
  const db = getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(schoolYears)
    .where(eq(schoolYears.isCurrent, true))
    .limit(1);
  return result[0] ?? null;
}

export async function createSchoolYear(
  data: InsertSchoolYear
): Promise<SchoolYear> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  if (data.isCurrent) {
    await db
      .update(schoolYears)
      .set({ isCurrent: false })
      .where(eq(schoolYears.isCurrent, true));
  }
  const result = await db.insert(schoolYears).values(data).returning();
  return result[0];
}

export async function setCurrentSchoolYear(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(schoolYears)
    .set({ isCurrent: false })
    .where(eq(schoolYears.isCurrent, true));
  await db
    .update(schoolYears)
    .set({ isCurrent: true })
    .where(eq(schoolYears.id, id));
}

// ========== Classes ==========

export async function getClassesByYear(yearId: string): Promise<Class[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(classes)
    .where(eq(classes.schoolYearId, yearId))
    .orderBy(asc(classes.sortOrder));
}

export async function getCurrentClasses(): Promise<Class[]> {
  const db = getDb();
  if (!db) return [];
  const year = await getCurrentSchoolYear();
  if (!year) return [];
  return getClassesByYear(year.id);
}

export async function createClass(data: InsertClass): Promise<Class> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(classes).values(data).returning();
  return result[0];
}

export async function updateClass(
  id: string,
  data: Partial<Pick<Class, "name" | "color" | "sortOrder">>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(classes).set(data).where(eq(classes.id, id));
}

export async function deleteClass(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(classes).where(eq(classes.id, id));
}

// ========== Students ==========

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(students)
    .where(eq(students.classId, classId))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

export async function getAllCurrentStudents(): Promise<
  (Student & { className: string; classColor: string })[]
> {
  const db = getDb();
  if (!db) return [];
  const year = await getCurrentSchoolYear();
  if (!year) return [];
  const currentClasses = await getClassesByYear(year.id);
  if (currentClasses.length === 0) return [];

  const classIds = currentClasses.map((c) => c.id);
  const allStudents = await db
    .select()
    .from(students)
    .where(inArray(students.classId, classIds))
    .orderBy(asc(students.lastName), asc(students.firstName));

  const classMap = new Map(currentClasses.map((c) => [c.id, c]));
  return allStudents.map((s) => ({
    ...s,
    className: classMap.get(s.classId)?.name ?? "",
    classColor: classMap.get(s.classId)?.color ?? "blue",
  }));
}

export async function createStudent(data: InsertStudent): Promise<Student> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(students).values(data).returning();
  return result[0];
}

export async function createStudentsBulk(
  data: InsertStudent[]
): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return;
  await db.insert(students).values(data);
}

export async function deleteStudent(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(reminders).where(eq(reminders.studentId, id));
  await db.delete(students).where(eq(students.id, id));
}

// ========== Reminder Categories ==========

export async function getCategories(): Promise<ReminderCategory[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(reminderCategories)
    .orderBy(asc(reminderCategories.sortOrder));
}

export async function createCategory(
  data: InsertReminderCategory
): Promise<ReminderCategory> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminderCategories).values(data).returning();
  return result[0];
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<ReminderCategory, "label" | "color" | "icon" | "sortOrder">>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(reminderCategories)
    .set(data)
    .where(eq(reminderCategories.id, id));
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(reminders)
    .set({ categoryId: null })
    .where(eq(reminders.categoryId, id));
  await db.delete(reminderCategories).where(eq(reminderCategories.id, id));
}

// ========== Reminders ==========

export async function getRemindersByClass(
  classId: string,
  pendingOnly: boolean = false
): Promise<
  (Reminder & {
    studentFirstName: string;
    studentLastName: string;
    studentGender: string | null;
    categoryLabel: string | null;
    categoryColor: string | null;
    categoryIcon: string | null;
  })[]
> {
  const db = getDb();
  if (!db) return [];

  const classStudents = await db
    .select()
    .from(students)
    .where(eq(students.classId, classId));
  if (classStudents.length === 0) return [];

  const studentIds = classStudents.map((s) => s.id);
  const studentMap = new Map(classStudents.map((s) => [s.id, s]));

  let query = db
    .select()
    .from(reminders)
    .where(inArray(reminders.studentId, studentIds))
    .orderBy(desc(reminders.createdAt));

  const allReminders = await query;
  const filtered = pendingOnly
    ? allReminders.filter((r) => !r.isDone)
    : allReminders;

  const cats = await getCategories();
  const catMap = new Map(cats.map((c) => [c.id, c]));

  return filtered.map((r) => {
    const student = studentMap.get(r.studentId);
    const cat = r.categoryId ? catMap.get(r.categoryId) : null;
    return {
      ...r,
      studentFirstName: student?.firstName ?? "",
      studentLastName: student?.lastName ?? "",
      studentGender: student?.gender ?? null,
      categoryLabel: cat?.label ?? null,
      categoryColor: cat?.color ?? null,
      categoryIcon: cat?.icon ?? null,
    };
  });
}

export async function createReminder(data: InsertReminder): Promise<Reminder> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reminders).values(data).returning();
  return result[0];
}

export async function updateReminder(
  id: string,
  data: Partial<
    Pick<Reminder, "text" | "categoryId" | "dueDate" | "isDone" | "doneAt">
  >
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(reminders)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(reminders.id, id));
}

export async function toggleReminder(id: string): Promise<Reminder | null> {
  const db = getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(reminders)
    .where(eq(reminders.id, id))
    .limit(1);
  if (result.length === 0) return null;
  const current = result[0];
  const newIsDone = !current.isDone;
  await db
    .update(reminders)
    .set({
      isDone: newIsDone,
      doneAt: newIsDone ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(reminders.id, id));
  return { ...current, isDone: newIsDone, doneAt: newIsDone ? new Date() : null };
}

export async function deleteReminder(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(reminders).where(eq(reminders.id, id));
}

// ========== Class Notes ==========

export async function getClassNotes(classId: string): Promise<ClassNote[]> {
  const db = getDb();
  if (!db) return [];
  return db
    .select()
    .from(classNotes)
    .where(eq(classNotes.classId, classId))
    .orderBy(desc(classNotes.isPinned), desc(classNotes.createdAt));
}

export async function createClassNote(
  data: InsertClassNote
): Promise<ClassNote> {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(classNotes).values(data).returning();
  return result[0];
}

export async function updateClassNote(
  id: string,
  data: Partial<Pick<ClassNote, "text" | "isPinned">>
): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(classNotes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(classNotes.id, id));
}

export async function deleteClassNote(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.delete(classNotes).where(eq(classNotes.id, id));
}

// ========== Pending counts (for chips badges) ==========

export async function getPendingCountsByClass(
  classIds: string[]
): Promise<Record<string, number>> {
  const db = getDb();
  if (!db) return {};

  const counts: Record<string, number> = {};
  for (const classId of classIds) {
    const classStudents = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.classId, classId));
    if (classStudents.length === 0) {
      counts[classId] = 0;
      continue;
    }
    const studentIds = classStudents.map((s) => s.id);
    const pending = await db
      .select()
      .from(reminders)
      .where(
        and(
          inArray(reminders.studentId, studentIds),
          eq(reminders.isDone, false)
        )
      );
    counts[classId] = pending.length;
  }
  return counts;
}
