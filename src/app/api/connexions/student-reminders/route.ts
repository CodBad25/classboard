import { NextResponse } from "next/server";
import { getAllCurrentStudents, getCategories } from "@/lib/queries";
import { getDb } from "@/lib/db";
import { reminders } from "../../../../../drizzle/schema";
import { inArray, desc } from "drizzle-orm";
import { studentKey, type StudentRemindersEntry, type ReminderLite } from "@/lib/student-matcher";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ map: {} });

    const students = await getAllCurrentStudents();
    if (students.length === 0) return NextResponse.json({ map: {} });

    const studentIds = students.map((s) => s.id);
    const all = await db
      .select()
      .from(reminders)
      .where(inArray(reminders.studentId, studentIds))
      .orderBy(desc(reminders.createdAt));

    const cats = await getCategories();
    const catMap = new Map(cats.map((c) => [c.id, c]));

    const pendingByStudent = new Map<string, ReminderLite[]>();
    const doneByStudent = new Map<string, ReminderLite[]>();
    for (const r of all) {
      const cat = r.categoryId ? catMap.get(r.categoryId) : null;
      const lite: ReminderLite = {
        id: r.id,
        text: r.text,
        dueDate: r.dueDate,
        doneAt: r.doneAt ? r.doneAt.toISOString() : null,
        categoryLabel: cat?.label ?? null,
        categoryIcon: cat?.icon ?? null,
        categoryColor: cat?.color ?? null,
      };
      const bucket = r.isDone ? doneByStudent : pendingByStudent;
      const list = bucket.get(r.studentId) ?? [];
      list.push(lite);
      bucket.set(r.studentId, list);
    }

    // Tri historique par doneAt desc (plus récent en premier)
    for (const list of doneByStudent.values()) {
      list.sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));
    }

    const map: Record<string, StudentRemindersEntry> = {};
    for (const s of students) {
      const pending = pendingByStudent.get(s.id) ?? [];
      const done = doneByStudent.get(s.id) ?? [];
      const key = studentKey(s.firstName, s.lastName, s.className);
      map[key] = {
        studentId: s.id,
        pendingCount: pending.length,
        doneCount: done.length,
        pending,
        done,
      };
    }

    return NextResponse.json({ map });
  } catch (e) {
    console.error("student-reminders API error", e);
    return NextResponse.json({ map: {}, error: "Failed" }, { status: 500 });
  }
}
