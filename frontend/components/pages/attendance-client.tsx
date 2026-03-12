"use client";

import { useMemo, useState } from "react";
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
  workers: Array<{ id: string; name: string; storeIds: string[]; workerType: "EMPLOYEE" | "MANAGER" }>;
  attendance: any[];
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;

  return `${hour12.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")} ${period}`;
}

export function AttendanceClient({ role, pastDaysAllowed, stores, workers, attendance }: AttendanceClientProps) {

  const router = useRouter();

  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");

  const [fromDate, setFromDate] = useState(getPreviousSaturday());
  const [toDate, setToDate] = useState(getToday());

  const filtered = useMemo(
    () =>
      attendance.filter((entry) => {
        const matchesSearch = entry.workerName.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || entry.storeId === storeFilter;

        const matchesFrom = !fromDate || entry.date >= fromDate;
        const matchesTo = !toDate || entry.date <= toDate;

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
            <p className="text-sm text-muted-foreground">
              Track working hours across stores and employees.
            </p>
          </div>

          <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[200px_180px_140px_140px_auto]">

            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee"
            />

            <Select value={storeFilter} onValueChange={setStoreFilter}>

              <SelectTrigger>
                <SelectValue placeholder="Store"/>
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
              onChange={(event) => setFromDate(event.target.value)}
            />

            <Input
              type="date"
              value={toDate}
              min={fromDate}
              max={getToday()}
              onChange={(event) => setToDate(event.target.value)}
            />

            <AddAttendanceModal
              triggerLabel="Add Attendance"
              stores={stores}
              workers={workers}
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
                  <th className="px-4 py-3 font-medium">Worker</th>
                  <th className="px-4 py-3 font-medium">Store</th>
                  <th className="px-4 py-3 font-medium">Type</th>
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

                    <td className="px-4 py-3 font-medium">{entry.workerName}</td>
                    <td className="px-4 py-3">{entry.store.name}</td>

                    <td className="px-4 py-3">
                      <Badge variant={entry.workerType === "MANAGER" ? "default" : "outline"}>
                        {entry.workerType === "MANAGER" ? "Manager" : "Employee"}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">{formatDate(entry.date)}</td>
                    <td className="px-4 py-3">{formatTime(entry.clockIn)}</td>
                    <td className="px-4 py-3">{formatTime(entry.clockOut)}</td>

                    <td className="px-4 py-3">
                      <Badge>{entry.totalHours.toFixed(2)} hrs</Badge>
                    </td>

                    <td className="px-4 py-3">

                      {role === "MANAGER" ? (
                        <span className="text-muted-foreground">Create only</span>
                      ) : (
                        <div className="flex gap-2">

                          <AddAttendanceModal
                            triggerLabel="Edit"
                            stores={stores}
                            workers={workers}
                            role={role}
                            pastDaysAllowed={pastDaysAllowed}
                            attendance={{
                              id: entry.id,
                              workerId: entry.workerId,
                              workerType: entry.workerType,
                              storeId: entry.storeId,
                              date: entry.date,
                              clockIn: entry.clockIn,
                              clockOut: entry.clockOut,
                              totalHours: entry.totalHours,
                            }}
                          />

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAttendance(entry.id)}
                          >
                            Delete
                          </Button>

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