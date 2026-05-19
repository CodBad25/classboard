// Auth simple mono-utilisateur : cookie de session signé HMAC-SHA256.
// Compatible Edge runtime (utilise Web Crypto API uniquement).

export const SESSION_COOKIE_NAME = "cb_session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours
export const SESSION_DURATION_S = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET manquante ou trop courte (>= 16 caractères requis)");
  }
  return s;
}

export function getPassword(): string {
  const p = process.env.AUTH_PASSWORD;
  if (!p) throw new Error("AUTH_PASSWORD manquante");
  return p;
}

async function hmacSign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_DURATION_MS;
  const sig = await hmacSign(String(expires), getSecret());
  return `${expires}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const idx = token.indexOf(".");
  if (idx <= 0) return false;
  const expStr = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  let expected: string;
  try {
    expected = await hmacSign(expStr, getSecret());
  } catch {
    return false;
  }
  // Comparaison constant-time naïve
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
