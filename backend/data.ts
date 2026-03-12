import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { aggregatePayrollEntries } from "@/backend/payroll";
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
  id: string;
  role: string;
  assignedStores: string[];
}) {
  return prisma.store.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            users: {
              some: {
                userId: user.id,
              },
            },
          },
    include: {
      employees: true,
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getEmployeesForUser(user: {
  id: string;
  role: string;
  assignedStores: string[];
}) {
  return prisma.employee.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            store: {
              users: {
                some: {
                  userId: user.id,
                },
              },
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
  id: string;
  role: string;
  assignedStores: string[];
}) {
  return prisma.attendance.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            store: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
    include: {
      employee: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      store: true,
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

export async function getUserManagementData(user: {
  role: string;
  assignedStores: string[];
}) {
  return prisma.user.findMany({
    where: {
      role: {
        in: ["CO_OWNER", "MANAGER"],
      },

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

    select: {
      id: true,
      username: true,
      role: true,
      pastDaysAllowed: true,
      payRate: true,

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
  id: string;
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
    id: string;
    role: string;
    assignedStores: string[];
  },
  from?: string,
  to?: string,
) {
  const start = from
    ? startOfDay(parseDateOnly(from))
    : startOfDay(subDays(new Date(), 13));

  const end = to
    ? endOfDay(parseDateOnly(to))
    : endOfDay(addDays(start, 13));

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
            store: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          }),
    },
    include: {
      employee: true,
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      store: true,
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return aggregatePayrollEntries(entries).map((row) => ({
    ...row,
    payPeriod: `${payPeriodStart}|${payPeriodEnd}`,
  }));
}