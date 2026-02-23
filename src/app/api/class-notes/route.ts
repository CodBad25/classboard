import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getClassNotes, createClassNote } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const classId = request.nextUrl.searchParams.get("classId");

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId query parameter is required" },
        { status: 400 }
      );
    }

    const notes = await getClassNotes(classId);
    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("Error fetching class notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch class notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, text, isPinned } = body;

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "classId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "text is required and must be a string" },
        { status: 400 }
      );
    }

    const note = await createClassNote({
      id: randomUUID(),
      classId,
      text,
      isPinned: isPinned === true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating class note:", error);
    return NextResponse.json(
      { error: "Failed to create class note" },
      { status: 500 }
    );
  }
}
