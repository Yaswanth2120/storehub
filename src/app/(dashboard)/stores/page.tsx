import { requireUser } from "@/backend/auth";
import { getStoresForUser } from "@/backend/data";
import { prisma } from "@/backend/prisma";
import { StoresClient } from "@/frontend/components/pages/stores-client";

export default async function StoresPage() {
  const user = await requireUser();
  const [stores, managers] = await Promise.all([
    getStoresForUser(user),
    prisma.user.findMany({ where: { role: "MANAGER" }, select: { id: true, username: true } }),
  ]);

  return <StoresClient role={user.role} stores={stores} managers={managers} />;
}
