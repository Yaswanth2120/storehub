import { DashboardLayoutShell } from "@/frontend/components/layout/root-layout";
import { requireUser } from "@/backend/auth";
import { getStoresForUser } from "@/backend/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const stores = await getStoresForUser(user);

  return (
    <DashboardLayoutShell
      user={{
        username: user.username,
        role: user.role,
      }}
      storeCount={stores.length}
    >
      {children}
    </DashboardLayoutShell>
  );
}