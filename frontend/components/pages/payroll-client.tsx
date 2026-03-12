"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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
};

function formatLocalDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getPreviousSaturday() {
  const today = new Date();
  const day = today.getDay();
  const diff = day >= 6 ? day - 6 : day + 1;

  const prevSaturday = new Date(today);
  prevSaturday.setDate(today.getDate() - diff);

  return formatLocalDate(prevSaturday);
}

function getToday() {
  return formatLocalDate(new Date());
}

function formatHours(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${hours.toFixed(2)}h (${wholeHours} hrs ${minutes} min)`;
}

export function PayrollClient({ stores, payroll }: PayrollClientProps) {

  const [rows, setRows] = useState(payroll);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");

  const [fromDate, setFromDate] = useState(getPreviousSaturday());
  const [toDate, setToDate] = useState(getToday());

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

  }, [fromDate, toDate]);

  const filtered = useMemo(() =>
    rows.filter((row) => {

      const matchesSearch = row.workerName
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStore =
        storeFilter === "all" || row.storeId === storeFilter;

      return matchesSearch && matchesStore;

    }),
    [rows, search, storeFilter]
  );

  const payPeriodLabel = `${formatDate(fromDate)} - ${formatDate(toDate)}`;

  return (

    <Card>

      {/* HEADER (same layout as Employees page) */}
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <CardTitle>Payroll</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage payroll and view employee compensation.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:flex-nowrap lg:items-center">

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-full lg:w-[180px]">
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
            value={fromDate}
            max={toDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full lg:w-[170px]"
          />

          <Input
            type="date"
            value={toDate}
            min={fromDate}
            max={getToday()}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full lg:w-[170px]"
          />

          <div className="relative w-full lg:w-[220px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="Search employee"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9"
            />
          </div>

        </div>

      </CardHeader>

      {/* TABLE */}
      <CardContent className="p-0">

        <div className="border-b bg-slate-50 px-6 py-3 text-sm font-medium text-slate-600">
          Pay period: {payPeriodLabel}
        </div>

        {loading ? (

          <div className="space-y-3 p-6">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead className="border-b bg-white text-left text-slate-400 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4">Worker</th>
                  <th className="px-6 py-4">Store</th>
                  <th className="px-6 py-4">Pay Period</th>
                  <th className="px-6 py-4">Total Hours</th>
                  <th className="px-6 py-4">Pay Rate</th>
                  <th className="px-6 py-4">Total Pay</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((row) => {

                  const [from, to] = row.payPeriod.split("|");

                  return (

                    <tr key={`${row.workerId}-${row.storeId}`} className="border-b">

                      <td className="px-6 py-4 font-medium">{row.workerName}</td>

                      <td className="px-6 py-4">{row.storeName}</td>

                      <td className="px-6 py-4">
                        {formatDate(from)} - {formatDate(to)}
                      </td>

                      <td className="px-6 py-4">
                        {formatHours(row.totalHours)}
                      </td>

                      <td className="px-6 py-4">
                        {row.payRate == null ? "Varies" : `$${row.payRate.toFixed(2)}`}
                      </td>

                      <td className="px-6 py-4 font-semibold">
                        ${row.totalPay.toFixed(2)}
                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        )}

      </CardContent>

    </Card>

  );
}
