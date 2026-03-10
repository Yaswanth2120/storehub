"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddAttendanceModal } from "@/frontend/components/modals/add-attendance-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { formatDate } from "@/lib/utils";

type AttendanceClientProps = {
  role: string;
  pastDaysAllowed: number | null;
  stores: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string; storeId: string }>;
  attendance: Array<{
    id: string;
    date: string;
    clockIn: string;
    clockOut: string;
    totalHours: number;
    employeeId: string;
    storeId: string;
    employee: { name: string };
    store: { name: string };
  }>;
};

export function AttendanceClient({ role, pastDaysAllowed, stores, employees, attendance }: AttendanceClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(
    () =>
      attendance.filter((entry) => {
        const matchesSearch = entry.employee.name.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || entry.storeId === storeFilter;
        const entryDate = format(new Date(entry.date), "yyyy-MM-dd");
        const matchesFrom = !fromDate || entryDate >= fromDate;
        const matchesTo = !toDate || entryDate <= toDate;
        return matchesSearch && matchesStore && matchesFrom && matchesTo;
      }),
    [attendance, search, storeFilter, fromDate, toDate],
  );

  async function deleteAttendance(attendanceId: string) {
    const response = await fetch(`/api/attendance?attendanceId=${attendanceId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Unable to delete attendance");
      return;
    }

    toast.success("Attendance deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {role === "MANAGER" && pastDaysAllowed ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You can only enter attendance for the past {pastDaysAllowed} days.
        </div>
      ) : null}
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Attendance</CardTitle>
            <p className="text-sm text-muted-foreground">Track working hours across stores and employees.</p>
          </div>
          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[200px_180px_140px_140px_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" />
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger><SelectValue placeholder="Store" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <AddAttendanceModal
              triggerLabel="Add Attendance"
              stores={stores}
              employees={employees}
              role={role}
              pastDaysAllowed={pastDaysAllowed}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="table-scroll overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee Name</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Clock In</th>
                  <th className="px-4 py-3 font-medium">Clock Out</th>
                  <th className="px-4 py-3 font-medium">Total Hours</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{entry.employee.name}</td>
                    <td className="px-4 py-3">{entry.store.name}</td>
                    <td className="px-4 py-3">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">{entry.clockIn}</td>
                    <td className="px-4 py-3">{entry.clockOut}</td>
                    <td className="px-4 py-3"><Badge>{entry.totalHours.toFixed(2)} hrs</Badge></td>
                    <td className="px-4 py-3">
                      {role === "MANAGER" ? (
                        <span className="text-muted-foreground">Create only</span>
                      ) : (
                        <div className="flex gap-2">
                          <AddAttendanceModal
                            triggerLabel="Edit"
                            stores={stores}
                            employees={employees}
                            role={role}
                            pastDaysAllowed={pastDaysAllowed}
                            attendance={{
                              id: entry.id,
                              employeeId: entry.employeeId,
                              storeId: entry.storeId,
                              date: entry.date,
                              clockIn: entry.clockIn,
                              clockOut: entry.clockOut,
                              totalHours: entry.totalHours,
                            }}
                          />
                          <Button variant="destructive" size="sm" onClick={() => deleteAttendance(entry.id)}>Delete</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
