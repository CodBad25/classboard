import { NextResponse } from "next/server";
import { getAllClasses } from "@/lib/hub";
import { getCurrentSchoolYear } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Filtré sur l'année courante de ClassBoard : sans ça le Hub renvoie
    // aussi les classes des années archivées.
    const year = await getCurrentSchoolYear();
    const classes = await getAllClasses(year?.label);
    return NextResponse.json({ classes });
  } catch (e) {
    console.error("proxy /api/hub/classes", e);
    return NextResponse.json({ classes: [], error: "Hub indisponible" }, { status: 502 });
  }
}
