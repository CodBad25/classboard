import { NextResponse } from "next/server";
import { getAllClasses } from "@/lib/hub";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const classes = await getAllClasses();
    return NextResponse.json({ classes });
  } catch (e) {
    console.error("proxy /api/hub/classes", e);
    return NextResponse.json({ classes: [], error: "Hub indisponible" }, { status: 502 });
  }
}
