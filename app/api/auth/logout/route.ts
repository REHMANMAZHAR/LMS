import { clearFamilySession } from "@/app/family-auth";

export async function POST() {
  await clearFamilySession();
  return Response.json({ ok: true });
}
