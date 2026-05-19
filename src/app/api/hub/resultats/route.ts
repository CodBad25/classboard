import { NextResponse } from "next/server";
import { getAllResultats } from "@/lib/hub";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const resultats = await getAllResultats();
    return NextResponse.json({ resultats });
  } catch (e) {
    console.error("proxy /api/hub/resultats", e);
    return NextResponse.json({ resultats: [], error: "Hub indisponible" }, { status: 502 });
  }
}
