import { NextResponse } from "next/server";
import { getCurrentClasses, getPendingCountsByClass } from "@/lib/queries";

export async function GET() {
  try {
    const classes = await getCurrentClasses();
    const classIds = classes.map((c) => c.id);
    const pendingCounts = await getPendingCountsByClass(classIds);

    return NextResponse.json(
      { classes, pendingCounts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching current classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch current classes" },
      { status: 500 }
    );
  }
}
