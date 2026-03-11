export type PayrollEntry = {
  employeeId: string | null;
  userId: string | null;
  storeId: string;
  totalHours: number;
  payRateSnapshot: number;
  employee?: {
    name: string;
  } | null;
  user?: {
    username: string;
  } | null;
  store: {
    name: string;
  };
};

export type AggregatedPayrollRow = {
  workerId: string;
  workerType: "EMPLOYEE" | "MANAGER";
  workerName: string;
  storeId: string;
  storeName: string;
  payRate: number | null;
  totalHours: number;
  totalPay: number;
};

export function aggregatePayrollEntries(entries: PayrollEntry[]): AggregatedPayrollRow[] {
  const grouped = new Map<
    string,
    {
      workerId: string;
      workerType: "EMPLOYEE" | "MANAGER";
      workerName: string;
      storeId: string;
      storeName: string;
      payRate: number | null;
      totalHours: number;
      totalPay: number;
      hasMixedRates: boolean;
    }
  >();

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
    totalPay: Number(row.totalPay.toFixed(2)),
  }));
}
