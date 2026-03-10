import { requireRole } from "@/backend/auth";
import { getStoresForUser, getUserManagementData } from "@/backend/data";
import { UsersClient } from "@/frontend/components/pages/users-client";

export default async function UsersPage() {
  await requireRole(["OWNER"]);
  const [users, stores] = await Promise.all([
    getUserManagementData(),
    getStoresForUser({ role: "OWNER", assignedStores: [] }),
  ]);

  return <UsersClient users={users as never} stores={stores.map((store) => ({ id: store.id, name: store.name }))} />;
}
