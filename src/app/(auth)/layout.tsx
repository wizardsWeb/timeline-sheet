import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session) redirect("/overview");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] font-bold">
            T
          </span>
          <span className="text-lg font-semibold">Timeline</span>
        </div>
        <div className="surface-card p-7 shadow-[0_2px_12px_rgba(15,17,21,0.06)]">
          {children}
        </div>
      </div>
    </div>
  );
}
