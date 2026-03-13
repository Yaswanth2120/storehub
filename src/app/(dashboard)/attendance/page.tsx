import { requireUser } from "@/backend/auth";
import { getAttendanceForUser, getEmployeesForUser, getManagerWorkersForUser, getStoresForUser } from "@/backend/data";
import { AttendanceClient } from "@/frontend/components/pages/attendance-client";
import { format } from "date-fns";
import { getManagerAllowedWeekStarts, getWeekOptions, formatLocalDate } from "@/lib/utils";

export default async function AttendancePage() {
  const user = await requireUser();
  const managerWeekOptions = getWeekOptions(2, new Date(), false);
  const [attendance, employees, managers, stores] = await Promise.all([
    getAttendanceForUser(user),
    getEmployeesForUser(user),
    getManagerWorkersForUser(user),
    getStoresForUser(user),
  ]);

  return (
    <AttendanceClient
      role={user.role}
      stores={stores.map((store) => ({ id: store.id, name: store.name }))}
      weekOptions={
        user.role === "MANAGER"
          ? getManagerAllowedWeekStarts().map((weekStart) => {
              const start = formatLocalDate(weekStart);
              const matchingOption = managerWeekOptions.find((option) => option.start === start);

              return matchingOption ?? { start, end: start, label: start };
            })
          : getWeekOptions(16)
      }
      workers={[
        ...employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
          storeIds: [employee.storeId],
          workerType: "EMPLOYEE" as const,
        })),
        ...managers.map((manager) => ({
          id: manager.id,
          name: manager.username,
          storeIds: manager.assignedStores.map((entry) => entry.storeId),
          workerType: "MANAGER" as const,
        })),
      ]}
      attendance={attendance.map((entry) => ({
        ...entry,
        weekStart: format(entry.date, "yyyy-MM-dd"),
        workerId: entry.userId ?? entry.employeeId ?? "",
        workerType: entry.userId ? "MANAGER" : "EMPLOYEE",
        workerName: entry.user?.username ?? entry.employee?.name ?? "Unknown worker",
      }))}
    />
  );
}
