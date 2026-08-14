import { createFamilySession, verifyFamilyAccessCode } from "@/app/family-auth";
import { clearFailedLogins, loginIsAllowed, recordFailedLogin } from "@/app/login-rate-limit";

export async function POST(request: Request) {
  try {
    if (!(await loginIsAllowed(request))) {
      return Response.json(
        { error: "Too many attempts. Please wait 30 minutes before trying again." },
        { status: 429 },
      );
    }
    const payload = (await request.json()) as { code?: unknown };
    const code = typeof payload.code === "string" ? payload.code : "";
    if (!(await verifyFamilyAccessCode(code))) {
      await recordFailedLogin(request);
      return Response.json({ error: "The family access code is incorrect." }, { status: 401 });
    }
    await clearFailedLogins(request);
    await createFamilySession();
    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    return Response.json({ error: message }, { status: 503 });
  }
}
