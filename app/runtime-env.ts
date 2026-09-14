export type RuntimeEnv = {
  DB?: unknown;
  FAMILY_ACCESS_CODE?: string;
  SESSION_SIGNING_SECRET?: string;
  QUIZ_BANK_DAILY_CSV_URL?: string;
};

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  const { env } = await import("cloudflare:workers");
  return env as unknown as RuntimeEnv;
}
