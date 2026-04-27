import { MockLoginPanel } from "@/components/custom/mock-login-panel";
import { getWorkforceSnapshot } from "@/lib/data/workforce";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const snapshot = await getWorkforceSnapshot();
  return <MockLoginPanel users={snapshot.users} />;
}
