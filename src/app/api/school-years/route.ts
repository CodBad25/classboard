import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSchoolYears, createSchoolYear } from "@/lib/queries";

export async function GET() {
  try {
    const years = await getSchoolYears();
    return NextResponse.json(years, { status: 200 });
  } catch (error) {
    console.error("Error fetching school years:", error);
    return NextResponse.json(
      { error: "Failed to fetch school years" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { label, isCurrent } = body;

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "label is required and must be a string" },
        { status: 400 }
      );
    }

    const year = await createSchoolYear({
      id: randomUUID(),
      label,
      isCurrent: isCurrent === true,
    });

    return NextResponse.json(year, { status: 201 });
  } catch (error) {
    console.error("Error creating school year:", error);
    return NextResponse.json(
      { error: "Failed to create school year" },
      { status: 500 }
    );
  }
}
