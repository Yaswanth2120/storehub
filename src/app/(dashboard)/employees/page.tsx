import { requireUser } from "@/backend/auth";
import { getEmployeesForUser, getStoresForUser } from "@/backend/data";
import { prisma } from "@/backend/prisma";
import { EmployeesClient } from "@/frontend/components/pages/employees-client";
import { ROLE_LABELS } from "@/backend/constants";

export default async function EmployeesPage() {
  const user = await requireUser();
  const [employees, stores, managementUsers] = await Promise.all([
    getEmployeesForUser(user),
    getStoresForUser(user),
    prisma.user.findMany({
      where:
        user.role === "OWNER"
          ? undefined
          : user.role === "CO_OWNER"
            ? {
                OR: [
                  { id: user.id },
                  {
                    assignedStores: {
                      some: {
                        storeId: {
                          in: user.assignedStores,
                        },
                      },
                    },
                  },
                ],
              }
            : {
                OR: [
                  { id: user.id },
                  {
                    assignedStores: {
                      some: {
                        storeId: {
                          in: user.assignedStores,
                        },
                      },
                    },
                  },
                ],
              },
      include: {
        assignedStores: {
          include: {
            store: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const personnel = [
    ...employees.map((employee) => ({
      id: employee.id,
      name: employee.name,
      kind: "EMPLOYEE" as const,
      status: employee.status,
      payRate: employee.payRate,
      storeIds: [employee.storeId],
      storeNames: [employee.store.name],
      roleLabel: "Employee",
    })),
    ...managementUsers.map((person) => ({
      id: `user-${person.id}`,
      name: person.username,
      kind: "USER" as const,
      status: "Active",
      payRate: 0,
      storeIds: person.assignedStores.map((entry) => entry.storeId),
      storeNames:
        person.role === "OWNER" && person.assignedStores.length === 0
          ? ["All Stores"]
          : person.assignedStores.map((entry) => entry.store.name),
      roleLabel: ROLE_LABELS[person.role] ?? person.role,
    })),
  ];

  return (
    <EmployeesClient
      role={user.role}
      stores={stores.map((store) => ({ id: store.id, name: store.name }))}
      employees={personnel}
    />
  );
}
