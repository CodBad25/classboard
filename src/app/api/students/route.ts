import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getStudentsByClass, createStudent } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const classId = request.nextUrl.searchParams.get("classId");

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId query parameter is required" },
        { status: 400 }
      );
    }

    const students = await getStudentsByClass(classId);
    return NextResponse.json(students, { status: 200 });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, firstName, lastName, gender } = body;

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json(
        { error: "firstName is required and must be a string" },
        { status: 400 }
      );
    }

    if (!lastName || typeof lastName !== "string") {
      return NextResponse.json(
        { error: "lastName is required and must be a string" },
        { status: 400 }
      );
    }

    const student = await createStudent({
      id: randomUUID(),
      classId,
      firstName,
      lastName,
      gender: gender || null,
      sortOrder: 0,
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
