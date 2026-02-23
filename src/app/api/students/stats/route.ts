import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { students, reminders, reminderCategories, classes } from "../../../../../drizzle/schema";
import { eq, inArray, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const studentId = request.nextUrl.searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    const db = getDb();
    if (!db) throw new Error("Database not available");

    // Get student info
    const studentResult = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentResult.length === 0) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const student = studentResult[0];

    // Get class info
    const classResult = await db
      .select()
      .from(classes)
      .where(eq(classes.id, student.classId))
      .limit(1);

    // Get all reminders for this student
    const studentReminders = await db
      .select()
      .from(reminders)
      .where(eq(reminders.studentId, studentId))
      .orderBy(desc(reminders.createdAt));

    // Get all categories
    const cats = await db.select().from(reminderCategories);
    const catMap = new Map(cats.map((c) => [c.id, c]));

    // Count by category
    const countByCategory: Record<string, { label: string; icon: string; color: string; count: number }> = {};
    for (const cat of cats) {
      countByCategory[cat.id] = {
        label: cat.label,
        icon: cat.icon,
        color: cat.color,
        count: 0,
      };
    }
    // "no category" bucket
    let noCategoryCount = 0;

    for (const r of studentReminders) {
      if (r.categoryId && countByCategory[r.categoryId]) {
        countByCategory[r.categoryId].count++;
      } else {
        noCategoryCount++;
      }
    }

    const totalReminders = studentReminders.length;
    const doneCount = studentReminders.filter((r) => r.isDone).length;
    const pendingCount = totalReminders - doneCount;

    // Enrich reminders with category info
    const enrichedReminders = studentReminders.map((r) => {
      const cat = r.categoryId ? catMap.get(r.categoryId) : null;
      return {
        ...r,
        categoryLabel: cat?.label ?? null,
        categoryIcon: cat?.icon ?? null,
        categoryColor: cat?.color ?? null,
      };
    });

    return NextResponse.json({
      student: {
        ...student,
        className: classResult[0]?.name ?? "",
        classColor: classResult[0]?.color ?? "blue",
      },
      stats: {
        total: totalReminders,
        done: doneCount,
        pending: pendingCount,
        byCategory: Object.values(countByCategory).filter((c) => c.count > 0),
        noCategory: noCategoryCount,
      },
      reminders: enrichedReminders,
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
