import { aggregatePayrollEntries } from "@/backend/payroll";
import { payRateChangeSchema } from "@/backend/validations";
import { calculateHours, formatDate, parseDateOnly } from "@/src/lib/utils";

describe("date utilities", () => {
  it("preserves calendar dates without timezone drift", () => {
    const parsed = parseDateOnly("2026-03-11");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(2);
    expect(parsed.getDate()).toBe(11);
    expect(formatDate("2026-03-11")).toBe("Mar 11, 2026");
  });

  it("calculates working hours from clock in and clock out", () => {
    expect(calculateHours("09:00", "17:30")).toBe(8.5);
    expect(calculateHours("17:30", "09:00")).toBe(0);
  });
});

describe("payroll aggregation", () => {
  it("sums payroll using each day's pay snapshot inside a mixed-rate range", () => {
    const rows = aggregatePayrollEntries([
      {
        employeeId: "employee-1",
        userId: null,
        storeId: "store-1",
        totalHours: 8,
        payRateSnapshot: 17,
        employee: { name: "Emma Reed" },
        store: { name: "Downtown Store" },
      },
      {
        employeeId: "employee-1",
        userId: null,
        storeId: "store-1",
        totalHours: 8,
        payRateSnapshot: 18.5,
        employee: { name: "Emma Reed" },
        store: { name: "Downtown Store" },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      workerName: "Emma Reed",
      totalHours: 16,
      payRate: null,
      totalPay: 284,
    });
  });
});

describe("pay rate change validation", () => {
  it("requires confirmation for all-record updates", () => {
    const result = payRateChangeSchema.safeParse({
      workerId: "worker-1",
      workerType: "EMPLOYEE",
      currentPayRate: 17,
      newPayRate: 18,
      applyMode: "ALL_RECORDS",
      confirmAllRecords: false,
    });

    expect(result.success).toBe(false);
  });
});
