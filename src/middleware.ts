import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://beltools.fr",
  "https://www.beltools.fr",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";

  // Preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowed || ALLOWED_ORIGINS[0],
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const response = NextResponse.next();

  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", allowed);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
