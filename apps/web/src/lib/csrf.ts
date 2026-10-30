import { cookies } from "next/headers";
import { createHmac } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET ?? "dev-csrf-secret-change-in-production";
const CSRF_COOKIE_NAME = "csrf-token";
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function signToken(token: string): string {
  return createHmac("sha256", CSRF_SECRET).update(token).digest("hex");
}

function verifyToken(token: string, signature: string): boolean {
  return createHmac("sha256", CSRF_SECRET).update(token).digest("hex") === signature;
}

export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);

  if (cookie) {
    const parts = cookie.value.split(".");
    const signature = parts[1] ?? "";
    const tokenPart = parts[0];
    if (tokenPart && verifyToken(cookie.value, signature)) {
      return tokenPart;
    }
  }

  const token = generateToken();
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;

  const cookieStore2 = await cookies();
  cookieStore2.set(CSRF_COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function getCsrfTokenFromRequest(request: Request): Promise<string | null> {
  const headerToken = request.headers.get("x-csrf-token");
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("csrf-token")?.value;

  if (!headerToken || !cookieToken) return null;

  if (!headerToken || !cookieToken) return null;

  const [cookieTokenValue, cookieSignature] = cookieToken.split(".");
  if (!cookieTokenValue || !cookieSignature) return null;

  if (!verifyToken(cookieTokenValue, cookieSignature)) return null;

  if (headerToken !== cookieTokenValue) return null;

  return headerToken;
}

export async function verifyCsrfFromRequest(request: Request): Promise<boolean> {
  const token = await getCsrfTokenFromRequest(request);
  return token !== null;
}

export function setCsrfCookie(token: string) {
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;

  return {
    name: CSRF_COOKIE_NAME,
    value: signedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: "/",
  };
}

export function generateCsrfInput(): { token: string; html: string } {
  const token = generateToken();
  const signature = signToken(token);
  const signedToken = `${token}.${signature}`;
  return {
    token,
    html: `<input type="hidden" name="csrf_token" value="${signedToken}" />`,
  };
}

export async function verifyCsrfFromForm(formData: FormData): Promise<boolean> {
  const signedToken = formData.get("csrf_token");
  if (!signedToken || typeof signedToken !== "string") return false;

  const [token, signature] = signedToken.split(".");
  if (!token || !signature) return false;

  return verifyToken(token, signature);
}