"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { WeekRangePicker } from "@/frontend/components/ui/week-range-picker";
import { cn, formatDate, formatLocalDate, getCurrentWeekStart, getPayrollPeriodBounds, getPayrollPeriodOptions } from "@/lib/utils";

type PayrollRow = {
  workerId: string;
  workerType: "EMPLOYEE" | "MANAGER";
  workerName: string;
  storeId: string;
  storeName: string;
  payRate: number | null;
  totalHours: number;
  totalPay: number;
  payPeriod: string;
};

type PayrollClientProps = {
  stores: Array<{ id: string; name: string }>;
  payroll: PayrollRow[];
};

type PayrollType = "BI_WEEKLY" | "WEEKLY";

function formatHours(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${hours.toFixed(2)}h (${wholeHours} hrs ${minutes} min)`;
}

export function PayrollClient({ stores, payroll }: PayrollClientProps) {
  const defaultStart = formatLocalDate(getCurrentWeekStart());

  const [rows, setRows] = useState(payroll);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [periodType, setPeriodType] = useState<PayrollType>("BI_WEEKLY");
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [loading, setLoading] = useState(false);

  const periodOptions = useMemo(() => getPayrollPeriodOptions(periodType, 24), [periodType]);

  useEffect(() => {
    let active = true;

    async function loadPayroll() {
      setLoading(true);

      const params = new URLSearchParams({
        periodType,
        periodStart,
      });

      const response = await fetch(`/api/payroll?${params.toString()}`);
      const data = await response.json();

      if (!active) return;

      if (response.ok) {
        setRows(data);
      }

      setLoading(false);
    }

    loadPayroll();

    return () => {
      active = false;
    };
  }, [periodStart, periodType]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = row.workerName.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || row.storeId === storeFilter;

        return matchesSearch && matchesStore;
      }),
    [rows, search, storeFilter],
  );

  const selectedPeriod = getPayrollPeriodBounds(periodType, periodStart);
  const payrollTypeLabel = periodType === "BI_WEEKLY" ? "Bi-Weekly" : "Weekly";

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
        <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
              Payroll
            </CardTitle>
            <p className="max-w-xl text-[15px] leading-6 text-[#6e6e73]">
              Review payroll by weekly periods. Bi-weekly is the default and every total honors
              actual worked dates, recorded hours, and historical pay changes inside the selected range.
            </p>
          </div>

          <div className="grid w-full gap-3 lg:grid-cols-4 xl:w-auto">
            <Select value={periodType} onValueChange={(value) => setPeriodType(value as PayrollType)}>
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] text-[#1d1d1f] shadow-none">
                <SelectValue placeholder="Payroll type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
              </SelectContent>
            </Select>

            <WeekRangePicker options={periodOptions} value={periodStart} onChange={setPeriodStart} />

            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] text-[#1d1d1f] shadow-none">
                <SelectValue placeholder="All stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e93]" />
              <Input
                placeholder="Search employee"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] pl-11 shadow-none"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6 pt-0">
          <div className="flex flex-col gap-3 rounded-[24px] border border-[#e5e5ea] bg-[#f8f8fa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Payroll Period</p>
              <p className="text-lg font-medium tracking-[-0.02em] text-[#1d1d1f]">
                {formatDate(selectedPeriod.from)} - {formatDate(selectedPeriod.to)}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4f5f8f] shadow-sm">
              <CalendarRange className="h-4 w-4" />
              {payrollTypeLabel}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[24px] border border-[#e5e5ea] bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ececf1] bg-[#fbfbfd] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Store</th>
                    <th className="px-6 py-4">Payroll Type</th>
                    <th className="px-6 py-4">Pay Period</th>
                    <th className="px-6 py-4">Total Hours</th>
                    <th className="px-6 py-4">Pay Rate</th>
                    <th className="px-6 py-4">Total Pay</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((row, index) => {
                    const [from, to] = row.payPeriod.split("|");

                    return (
                      <tr
                        key={`${row.workerId}-${row.storeId}`}
                        className={cn(
                          "border-b border-[#f1f1f4] text-[15px] text-[#3a3a3c] transition-colors hover:bg-[#fafafd]",
                          index === filtered.length - 1 && "border-b-0",
                        )}
                      >
                        <td className="px-6 py-4 font-medium text-[#1d1d1f]">{row.workerName}</td>
                        <td className="px-6 py-4">{row.storeName}</td>
                        <td className="px-6 py-4 text-[#6e6e73]">{payrollTypeLabel}</td>
                        <td className="px-6 py-4 text-[#6e6e73]">
                          {formatDate(from)} - {formatDate(to)}
                        </td>
                        <td className="px-6 py-4">{formatHours(row.totalHours)}</td>
                        <td className="px-6 py-4">
                          {row.payRate == null ? "Varies" : `$${row.payRate.toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 font-semibold text-[#1d1d1f]">${row.totalPay.toFixed(2)}</td>
                      </tr>
                    );
                  })}

                  {!filtered.length ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#6e6e73]">
                        No payroll entries exist for this period and store filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
