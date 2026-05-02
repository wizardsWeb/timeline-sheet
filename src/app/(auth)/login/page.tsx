import Link from "next/link";
import { LoginForm } from "./login-form";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Timeline workspace.
        </p>
      </div>
      <LoginForm next={next} />
      <div className="space-y-3">
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-[color:var(--primary)] hover:underline"
          >
            Create an account
          </Link>
        </p>
        <div className="rounded-[10px] border border-dashed border-border bg-secondary/40 p-3 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground/80 mb-1">Demo accounts</p>
          <p>admin@demo.com / admin123</p>
          <p>manager@demo.com / manager123</p>
          <p>alice@demo.com / employee123</p>
        </div>
      </div>
    </div>
  );
}
