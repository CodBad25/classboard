import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getClassesByYear, createClass } from "@/lib/queries";

export async function GET(request: NextRequest) {
  try {
    const yearId = request.nextUrl.searchParams.get("yearId");

    if (!yearId || typeof yearId !== "string") {
      return NextResponse.json(
        { error: "yearId query parameter is required" },
        { status: 400 }
      );
    }

    const classes = await getClassesByYear(yearId);
    return NextResponse.json(classes, { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schoolYearId, name, color, sortOrder } = body;

    if (!schoolYearId || typeof schoolYearId !== "string") {
      return NextResponse.json(
        { error: "schoolYearId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required and must be a string" },
        { status: 400 }
      );
    }

    if (!color || typeof color !== "string") {
      return NextResponse.json(
        { error: "color is required and must be a string" },
        { status: 400 }
      );
    }

    const classData = await createClass({
      id: randomUUID(),
      schoolYearId,
      name,
      color,
      sortOrder: sortOrder ?? 0,
    });

    return NextResponse.json(classData, { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    );
  }
}
