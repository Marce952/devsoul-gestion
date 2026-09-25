import { requireUser } from "@/lib/auth/session";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return <DashboardShell user={{ name: user.name, role: user.role }}>{children}</DashboardShell>;
}
