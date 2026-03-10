import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { prisma } from "@/backend/prisma";

export async function getSettings() {
  const settings = await prisma.systemSettings.findFirst();

  if (settings) {
    return settings;
  }

  return prisma.systemSettings.create({
    data: {
      companyName: "StoreHub Operations",
      timezone: "America/Chicago",
      recoveryEmail: "owner@storehub.dev",
    },
  });
}

export async function getStoresForUser(user: {
  role: string;
  assignedStores: string[];
}) {
  return prisma.store.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            id: {
              in: user.assignedStores,
            },
          },
    include: {
      employees: true,
      users: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getEmployeesForUser(user: {
  role: string;
  assignedStores: string[];
}) {
  return prisma.employee.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            storeId: {
              in: user.assignedStores,
            },
          },
    include: {
      store: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAttendanceForUser(user: {
  role: string;
  assignedStores: string[];
}) {
  return prisma.attendance.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            storeId: {
              in: user.assignedStores,
            },
          },
    include: {
      employee: true,
      store: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getUserManagementData() {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["CO_OWNER", "MANAGER"],
      },
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
  });
}

export async function getPayrollForUser(
  user: {
    role: string;
    assignedStores: string[];
  },
  from?: string,
  to?: string,
) {
  const start = from ? startOfDay(new Date(from)) : startOfDay(subDays(new Date(), 13));
  const end = to ? endOfDay(new Date(to)) : endOfDay(addDays(start, 13));

  const entries = await prisma.attendance.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
      ...(user.role === "OWNER"
        ? {}
        : {
            storeId: {
              in: user.assignedStores,
            },
          }),
    },
    include: {
      employee: true,
      store: true,
    },
  });

  const grouped = new Map<string, {
    employeeId: string;
    employeeName: string;
    storeId: string;
    storeName: string;
    payRate: number;
    totalHours: number;
  }>();

  for (const entry of entries) {
    const key = `${entry.employeeId}-${entry.storeId}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.totalHours += entry.totalHours;
      continue;
    }

    grouped.set(key, {
      employeeId: entry.employeeId,
      employeeName: entry.employee.name,
      storeId: entry.storeId,
      storeName: entry.store.name,
      payRate: entry.employee.payRate,
      totalHours: entry.totalHours,
    });
  }

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    payPeriod: `${start.toISOString()}|${end.toISOString()}`,
    totalPay: Number((row.totalHours * row.payRate).toFixed(2)),
  }));
}
