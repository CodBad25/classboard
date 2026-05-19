import { NextRequest, NextResponse } from "next/server";
import { getCurrentClasses, getRemindersByClass } from "@/lib/queries";

const ALLOWED_ORIGINS = [
  "https://beltools.fr",
  "https://www.beltools.fr",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const className = request.nextUrl.searchParams.get("className");

    if (!className) {
      return NextResponse.json(
        { error: "className query parameter is required (e.g. 5A, 6C)" },
        { status: 400, headers }
      );
    }

    const classes = await getCurrentClasses();
    const match = classes.find(
      (c) => c.name.toUpperCase() === className.toUpperCase()
    );

    if (!match) {
      return NextResponse.json(
        { error: `No class found with name "${className}"`, available: classes.map((c) => c.name) },
        { status: 404, headers }
      );
    }

    const reminders = await getRemindersByClass(match.id, true);

    return NextResponse.json(
      {
        classId: match.id,
        className: match.name,
        color: match.color,
        reminders,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Error fetching dashboard reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500, headers }
    );
  }
}
