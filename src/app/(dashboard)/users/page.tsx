import { requireUser, requireRole } from "@/backend/auth";
import { getStoresForUser, getUserManagementData } from "@/backend/data";
import { UsersClient } from "@/frontend/components/pages/users-client";

export default async function UsersPage() {
  const user = await requireUser();

  await requireRole(["OWNER", "CO_OWNER"]);

const [users, stores] = await Promise.all([
  getUserManagementData(user),
  getStoresForUser(user),
]);

  return (
    <UsersClient
      role={user.role as "OWNER" | "CO_OWNER"}
      users={users as never}
      stores={stores.map((store) => ({
        id: store.id,
        name: store.name,
      }))}
    />
  );
}