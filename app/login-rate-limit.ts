import { eq } from "drizzle-orm";
import { getRuntimeEnv } from "./runtime-env";
import { getDb } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 30 * 60 * 1000;
const MAX_ATTEMPTS = 8;

async function requestKey(request: Request) {
  const env = await getRuntimeEnv();
  const secret = env.SESSION_SIGNING_SECRET ?? "unconfigured";
  const address =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const bytes = new TextEncoder().encode(`${secret}|${address}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function loginIsAllowed(request: Request) {
  const db = await getDb();
  const key = await requestKey(request);
  const row = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.key, key),
  });
  if (!row) return true;

  const now = Date.now();
  if (row.blockedUntil && new Date(row.blockedUntil).getTime() > now) return false;
  if (new Date(row.windowStartedAt).getTime() + WINDOW_MS <= now) {
    await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
  }
  return true;
}

export async function recordFailedLogin(request: Request) {
  const db = await getDb();
  const key = await requestKey(request);
  const now = new Date();
  const row = await db.query.loginAttempts.findFirst({
    where: eq(loginAttempts.key, key),
  });
  const insideWindow = row && new Date(row.windowStartedAt).getTime() + WINDOW_MS > now.getTime();
  const attempts = insideWindow ? row.attempts + 1 : 1;
  const blockedUntil = attempts >= MAX_ATTEMPTS
    ? new Date(now.getTime() + BLOCK_MS).toISOString()
    : null;
  await db
    .insert(loginAttempts)
    .values({
      key,
      attempts,
      windowStartedAt: insideWindow ? row.windowStartedAt : now.toISOString(),
      blockedUntil,
    })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        attempts,
        windowStartedAt: insideWindow ? row.windowStartedAt : now.toISOString(),
        blockedUntil,
      },
    });
}

export async function clearFailedLogins(request: Request) {
  const db = await getDb();
  const key = await requestKey(request);
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}
