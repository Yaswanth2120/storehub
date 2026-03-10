import { DashboardLayoutShell } from "@/frontend/components/layout/root-layout";
import { requireUser } from "@/backend/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <DashboardLayoutShell
      user={{
        username: user.username,
        role: user.role,
        assignedStores: user.assignedStores,
      }}
    >
      {children}
    </DashboardLayoutShell>
  );
}
