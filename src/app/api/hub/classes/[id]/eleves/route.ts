import { NextResponse } from "next/server";
import { getEleves } from "@/lib/hub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const eleves = await getEleves(id);
    return NextResponse.json({ eleves });
  } catch (e) {
    console.error("proxy /api/hub/classes/[id]/eleves", e);
    return NextResponse.json({ eleves: [], error: "Hub indisponible" }, { status: 502 });
  }
}
