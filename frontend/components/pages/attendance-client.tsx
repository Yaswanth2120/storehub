"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";
import { AddAttendanceModal } from "@/frontend/components/modals/add-attendance-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { WeekRangePicker } from "@/frontend/components/ui/week-range-picker";
import { formatDate, formatLocalDate, getWeekEndFriday } from "@/lib/utils";

type AttendanceClientProps = {
  role: string;
  stores: Array<{ id: string; name: string }>;
  weekOptions: Array<{ start: string; end: string; label: string }>;
  workers: Array<{ id: string; name: string; storeIds: string[]; workerType: "EMPLOYEE" | "MANAGER" }>;
  attendance: Array<{
    id: string;
    weekStart: string;
    workerId: string;
    workerType: "EMPLOYEE" | "MANAGER";
    workerName: string;
    storeId: string;
    totalHours: number;
    store: { name: string };
  }>;
};

export function AttendanceClient({ role, stores, weekOptions, workers, attendance }: AttendanceClientProps) {
  const router = useRouter();

  const defaultWeekStart = weekOptions[0]?.start ?? formatLocalDate(new Date());
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [selectedWeekStart, setSelectedWeekStart] = useState(defaultWeekStart);

  const selectedWeek = weekOptions.find((option) => option.start === selectedWeekStart) ?? {
    start: selectedWeekStart,
    end: formatLocalDate(getWeekEndFriday(selectedWeekStart)),
    label: `${formatDate(selectedWeekStart)} - ${formatDate(getWeekEndFriday(selectedWeekStart))}`,
  };

  const filtered = useMemo(
    () =>
      attendance.filter((entry) => {
        const matchesSearch = entry.workerName.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || entry.storeId === storeFilter;
        const matchesWeek = entry.weekStart === selectedWeek.start;

        return matchesSearch && matchesStore && matchesWeek;
      }),
    [attendance, search, selectedWeek.start, storeFilter],
  );

  async function deleteAttendance(attendanceId: string) {
    const response = await fetch(`/api/attendance?attendanceId=${attendanceId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Unable to delete attendance");
      return;
    }

    toast.success("Weekly attendance deleted");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {role === "MANAGER" ? (
        <div className="rounded-[24px] border border-[#d7e3ff] bg-[#f4f7ff] px-5 py-4 text-sm leading-6 text-[#445274]">
          Managers can add or update weekly hours only for the two most recent completed Saturday to Friday periods, and only inside assigned stores.
        </div>
      ) : null}

      <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
        <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">Attendance</CardTitle>
            <p className="max-w-xl text-[15px] leading-6 text-[#6e6e73]">
              Managers now enter total weekly hours instead of daily shifts. Choose a weekly period, then record the total time worked from Saturday through Friday.
            </p>
          </div>

          <div className="grid w-full gap-3 lg:grid-cols-[1.8fr_1fr_1fr_auto] xl:w-auto">
            <WeekRangePicker options={weekOptions} value={selectedWeekStart} onChange={setSelectedWeekStart} />

            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] text-[#1d1d1f] shadow-none">
                <SelectValue placeholder="Store" />
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee"
              className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none"
            />

            <AddAttendanceModal
              triggerLabel="Add Weekly Hours"
              stores={stores}
              workers={workers}
              role={role}
              weekStart={selectedWeek.start}
              weekEnd={selectedWeek.end}
              allowedWeekStarts={weekOptions.map((week) => week.start)}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-6 pt-0">
          <div className="flex flex-col gap-3 rounded-[24px] border border-[#e5e5ea] bg-[#f8f8fa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Attendance Week</p>
              <p className="text-lg font-medium tracking-[-0.02em] text-[#1d1d1f]">{selectedWeek.label}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4f5f8f] shadow-sm">
              <CalendarRange className="h-4 w-4" />
              Weekly Hours
            </div>
          </div>

          <div className="table-scroll overflow-x-auto rounded-[24px] border border-[#e5e5ea] bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[#ececf1] bg-[#fbfbfd] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
                  <th className="px-4 py-4">Worker</th>
                  <th className="px-4 py-4">Store</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Attendance Week</th>
                  <th className="px-4 py-4">Total Weekly Hours</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={index === filtered.length - 1 ? "text-[15px]" : "border-b border-[#f1f1f4] text-[15px]"}
                  >
                    <td className="px-4 py-4 font-medium text-[#1d1d1f]">{entry.workerName}</td>
                    <td className="px-4 py-4 text-[#3a3a3c]">{entry.store.name}</td>
                    <td className="px-4 py-4">
                      <Badge variant={entry.workerType === "MANAGER" ? "default" : "outline"}>
                        {entry.workerType === "MANAGER" ? "Manager" : "Employee"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-[#6e6e73]">{selectedWeek.label}</td>
                    <td className="px-4 py-4">
                      <Badge className="rounded-full bg-[#f1f5ff] px-3 py-1 font-medium text-[#4461b8]">
                        {entry.totalHours.toFixed(2)} hrs
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AddAttendanceModal
                          triggerLabel={role === "MANAGER" ? "Update Hours" : "Edit"}
                          stores={stores}
                          workers={workers}
                          role={role}
                          weekStart={selectedWeek.start}
                          weekEnd={selectedWeek.end}
                          allowedWeekStarts={weekOptions.map((week) => week.start)}
                          attendance={{
                            id: entry.id,
                            workerId: entry.workerId,
                            workerType: entry.workerType,
                            storeId: entry.storeId,
                            weekStart: entry.weekStart,
                            totalHours: entry.totalHours,
                          }}
                        />

                        {role !== "MANAGER" ? (
                          <Button variant="destructive" size="sm" onClick={() => deleteAttendance(entry.id)}>
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-[#6e6e73]">
                      No weekly attendance records exist for this period yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
