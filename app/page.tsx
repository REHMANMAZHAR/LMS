import { getFamilySession } from "./family-auth";
import LoginPanel from "./login-panel";
import StudyDashboard from "./study-dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getFamilySession();
  if (!session) return <LoginPanel />;

  return <StudyDashboard displayName={session.displayName} />;
}
