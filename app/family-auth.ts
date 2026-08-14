import { cookies } from "next/headers";
import { getRuntimeEnv } from "./runtime-env";

const COOKIE_NAME = "talha_family_session";
const FAMILY_ID = "talha-family";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export type FamilySession = {
  familyId: string;
  displayName: string;
};

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmac(value: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function getSigningSecret() {
  const env = await getRuntimeEnv();
  if (!env.SESSION_SIGNING_SECRET || env.SESSION_SIGNING_SECRET.length < 32) {
    throw new Error("Family sign-in has not been configured yet.");
  }
  return env.SESSION_SIGNING_SECRET;
}

export async function verifyFamilyAccessCode(value: string) {
  const env = await getRuntimeEnv();
  const configuredCode = env.FAMILY_ACCESS_CODE?.trim();
  if (!configuredCode || configuredCode.length < 12) {
    throw new Error("Family sign-in has not been configured yet.");
  }
  return timingSafeEqual(value.trim(), configuredCode);
}

export async function createFamilySession() {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const payload = `${FAMILY_ID}.${expiresAt}`;
  const signature = await hmac(payload, await getSigningSecret());
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${payload}.${signature}`, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function clearFamilySession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function getFamilySession(): Promise<FamilySession | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [familyId, expiresText, suppliedSignature, ...extra] = raw.split(".");
  const expiresAt = Number(expiresText);
  if (
    extra.length ||
    familyId !== FAMILY_ID ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Date.now() ||
    !suppliedSignature
  ) {
    return null;
  }

  const payload = `${familyId}.${expiresAt}`;
  const expectedSignature = await hmac(payload, await getSigningSecret());
  if (!timingSafeEqual(suppliedSignature, expectedSignature)) return null;

  return { familyId, displayName: "Talha Family" };
}

export async function requireFamilySession() {
  const session = await getFamilySession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}
