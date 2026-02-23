import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createStudentsBulk, getStudentsByClass } from "@/lib/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, students } = body;

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(students)) {
      return NextResponse.json(
        { error: "students must be an array" },
        { status: 400 }
      );
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: "students array cannot be empty" },
        { status: 400 }
      );
    }

    for (const student of students) {
      if (
        !student.firstName ||
        typeof student.firstName !== "string" ||
        !student.lastName ||
        typeof student.lastName !== "string"
      ) {
        return NextResponse.json(
          { error: "Each student must have firstName and lastName" },
          { status: 400 }
        );
      }
    }

    const existingStudents = await getStudentsByClass(classId);
    const existingLastNames = new Set(
      existingStudents.map((s) => s.lastName.toLowerCase())
    );

    const sorted = students
      .filter(
        (s) =>
          !existingLastNames.has(s.lastName.toLowerCase())
      )
      .sort((a, b) => a.lastName.localeCompare(b.lastName));

    const newStudents = sorted.map((student, index) => ({
      id: randomUUID(),
      classId,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender || null,
      sortOrder: existingStudents.length + index,
    }));

    await createStudentsBulk(newStudents);

    return NextResponse.json(
      { imported: newStudents.length, students: newStudents },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing students:", error);
    return NextResponse.json(
      { error: "Failed to import students" },
      { status: 500 }
    );
  }
}
