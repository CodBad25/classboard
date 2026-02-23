import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getRemindersByClass, createReminder } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const classId = request.nextUrl.searchParams.get("classId");
    const pending = request.nextUrl.searchParams.get("pending");

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId query parameter is required" },
        { status: 400 }
      );
    }

    const pendingOnly = pending === "true";
    const reminders = await getRemindersByClass(classId, pendingOnly);
    return NextResponse.json(reminders, { status: 200 });
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, categoryId, text, dueDate } = body;

    if (!studentId || typeof studentId !== "string") {
      return NextResponse.json(
        { error: "studentId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required and must be a string" },
        { status: 400 }
      );
    }

    const reminder = await createReminder({
      id: randomUUID(),
      studentId,
      categoryId: categoryId || null,
      text,
      dueDate: dueDate || null,
      isDone: false,
      doneAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
