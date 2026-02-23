import { NextRequest, NextResponse } from "next/server";
import { setCurrentSchoolYear } from "@/lib/queries";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isCurrent } = body;

    if (isCurrent !== true) {
      return NextResponse.json(
        { error: "isCurrent must be true" },
        { status: 400 }
      );
    }

    await setCurrentSchoolYear(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating school year:", error);
    return NextResponse.json(
      { error: "Failed to update school year" },
      { status: 500 }
    );
  }
}
