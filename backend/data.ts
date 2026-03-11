import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/backend/prisma";
import { parseDateOnly } from "@/lib/utils";

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
      payRateHistory: {
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
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
      user: true,
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
      payRateHistory: {
        orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getManagerWorkersForUser(user: {
  role: string;
  assignedStores: string[];
}) {
  return prisma.user.findMany({
    where: {
      role: "MANAGER",
      ...(user.role === "OWNER"
        ? {}
        : {
            assignedStores: {
              some: {
                storeId: {
                  in: user.assignedStores,
                },
              },
            },
          }),
    },
    include: {
      assignedStores: true,
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
  const start = from ? startOfDay(parseDateOnly(from)) : startOfDay(subDays(new Date(), 13));
  const end = to ? endOfDay(parseDateOnly(to)) : endOfDay(addDays(start, 13));
  const payPeriodStart = from ?? format(start, "yyyy-MM-dd");
  const payPeriodEnd = to ?? format(end, "yyyy-MM-dd");

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
      user: true,
      store: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  const grouped = new Map<string, {
    workerId: string;
    workerType: "EMPLOYEE" | "MANAGER";
    workerName: string;
    storeId: string;
    storeName: string;
    payRate: number | null;
    totalHours: number;
    totalPay: number;
    hasMixedRates: boolean;
  }>();

  for (const entry of entries) {
    const isManager = Boolean(entry.userId);
    const workerId = entry.userId ?? entry.employeeId ?? "";
    const payRate = entry.payRateSnapshot;
    const workerName = isManager ? entry.user?.username ?? "Unknown worker" : entry.employee?.name ?? "Unknown worker";
    const key = `${workerId}-${entry.storeId}-${isManager ? "MANAGER" : "EMPLOYEE"}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.totalHours += entry.totalHours;
      existing.totalPay += entry.totalHours * payRate;
      existing.hasMixedRates = existing.hasMixedRates || existing.payRate !== payRate;
      existing.payRate = payRate;
      continue;
    }

    grouped.set(key, {
      workerId,
      workerType: isManager ? "MANAGER" : "EMPLOYEE",
      workerName,
      storeId: entry.storeId,
      storeName: entry.store.name,
      payRate,
      totalHours: entry.totalHours,
      totalPay: entry.totalHours * payRate,
      hasMixedRates: false,
    });
  }

  return Array.from(grouped.values()).map((row) => ({
    workerId: row.workerId,
    workerType: row.workerType,
    workerName: row.workerName,
    storeId: row.storeId,
    storeName: row.storeName,
    payRate: row.hasMixedRates ? null : row.payRate,
    totalHours: Number(row.totalHours.toFixed(2)),
    payPeriod: `${payPeriodStart}|${payPeriodEnd}`,
    totalPay: Number(row.totalPay.toFixed(2)),
  }));
}
