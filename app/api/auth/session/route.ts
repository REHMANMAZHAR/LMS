import { getFamilySession } from "@/app/family-auth";

export async function GET() {
  const session = await getFamilySession();
  return Response.json({ authenticated: Boolean(session), session });
}
