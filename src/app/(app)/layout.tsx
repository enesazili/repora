import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session.authenticated) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
