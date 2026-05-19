import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const ALLOWED_ORIGINS = [
  "https://beltools.fr",
  "https://www.beltools.fr",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

// Routes accessibles sans auth
const PUBLIC_EXACT = new Set<string>(["/login", "/api/auth/login", "/api/auth/logout"]);
const PUBLIC_PREFIXES = ["/api/dashboard/"]; // utilisé par BelTools (déjà CORS-protégé)

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function corsResponseForDashboard(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "";

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API publique BelTools : CORS only, pas d'auth
  if (pathname.startsWith("/api/dashboard/")) {
    return corsResponseForDashboard(request) ?? NextResponse.next();
  }

  // Routes publiques (login page + endpoints auth)
  if (isPublic(pathname)) return NextResponse.next();

  // Vérification du cookie de session
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionToken(token);

  if (valid) return NextResponse.next();

  // API : 401 JSON ; pages : redirect vers /login
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Exclure : _next, favicon, manifest, sw, images statiques
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|webmanifest|js|css)$).*)",
  ],
};
