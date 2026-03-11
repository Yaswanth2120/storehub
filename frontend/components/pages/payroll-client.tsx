"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { Skeleton } from "@/frontend/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

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
  defaultFrom: string;
  defaultTo: string;
};

export function PayrollClient({ stores, payroll, defaultFrom, defaultTo }: PayrollClientProps) {
  const [rows, setRows] = useState(payroll);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPayroll() {
      setLoading(true);
      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
      });

      const response = await fetch(`/api/payroll?${params.toString()}`);
      const data = await response.json();

      if (!active) {
        return;
      }

      if (response.ok) {
        setRows(data);
      }

      setLoading(false);
    }

    void loadPayroll();

    return () => {
      active = false;
    };
  }, [fromDate, toDate]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = row.workerName.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || row.storeId === storeFilter;
        return matchesSearch && matchesStore;
      }),
    [rows, search, storeFilter],
  );

  const payPeriodLabel = `${formatDate(fromDate)} - ${formatDate(toDate)}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Payroll</h2>
        <p className="mt-2 text-base text-slate-500">Manage payroll and view employee compensation.</p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 rounded-2xl border bg-slate-50/70 p-5 xl:flex-row xl:items-center">
            <div className="flex items-center gap-3 text-base font-semibold text-slate-700">
              <Filter className="h-5 w-5 text-slate-500" />
              Filters:
            </div>
            <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-[280px_230px_24px_230px_minmax(240px,1fr)]">
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="h-12 rounded-2xl bg-white text-sm">
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

              <Input
                type="date"
                className="h-12 rounded-2xl bg-white text-sm"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                max={toDate}
              />

              <div className="hidden items-center justify-center text-base font-semibold text-slate-400 xl:flex">to</div>

              <Input
                type="date"
                className="h-12 rounded-2xl bg-white text-sm"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                min={fromDate}
              />

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by employee name"
                  className="h-12 rounded-2xl bg-white pl-12 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-slate-50/60">
          <CardTitle className="text-base font-semibold text-slate-600">Pay period: {payPeriodLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div className="table-scroll overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="border-b bg-white text-left uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                            <th className="px-10 py-5 font-semibold">Worker</th>
                    <th className="px-6 py-5 font-semibold">Store</th>
                    <th className="px-6 py-5 font-semibold">Pay Period</th>
                    <th className="px-6 py-5 font-semibold">Total Hours</th>
                    <th className="px-6 py-5 font-semibold">Pay Rate</th>
                    <th className="px-6 py-5 font-semibold">Total Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-14 text-center text-base text-slate-500">
                        No payroll records found for this filter range.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const [from, to] = row.payPeriod.split("|");

                      return (
                        <tr key={`${row.workerId}-${row.storeId}`} className="border-b last:border-b-0">
                          <td className="px-10 py-6 text-lg font-semibold text-slate-900">
                            {row.workerName}
                            {row.workerType === "MANAGER" ? (
                              <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-primary">Manager</span>
                            ) : null}
                          </td>
                          <td className="px-6 py-6 text-lg text-slate-600">{row.storeName}</td>
                          <td className="px-6 py-6 text-lg text-slate-600">
                            {formatDate(from)} - {formatDate(to)}
                          </td>
                          <td className="px-6 py-6 text-lg text-slate-900">{row.totalHours.toFixed(1)}h</td>
                          <td className="px-6 py-6 text-lg text-slate-900">
                            {row.payRate == null ? "Varies" : `$${row.payRate.toFixed(2)}`}
                          </td>
                          <td className="px-6 py-6 text-lg font-semibold text-slate-900">${row.totalPay.toFixed(2)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
