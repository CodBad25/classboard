import { NextRequest, NextResponse } from "next/server";
import { getAllCurrentStudents } from "@/lib/queries";
import { createStudentSearcher, searchStudents } from "@/lib/fuzzy";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "q query parameter is required and must not be empty" },
        { status: 400 }
      );
    }

    const students = await getAllCurrentStudents();
    const searcher = createStudentSearcher(students);
    const results = searchStudents(searcher, query, 10);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
