import { requireUser } from "@/backend/auth";
import { getAttendanceForUser, getEmployeesForUser, getManagerWorkersForUser, getStoresForUser } from "@/backend/data";
import { AttendanceClient } from "@/frontend/components/pages/attendance-client";
import { format } from "date-fns";

export default async function AttendancePage() {
  const user = await requireUser();
  const [attendance, employees, managers, stores] = await Promise.all([
    getAttendanceForUser(user),
    getEmployeesForUser(user),
    getManagerWorkersForUser(user),
    getStoresForUser(user),
  ]);

  return (
    <AttendanceClient
      role={user.role}
      pastDaysAllowed={user.pastDaysAllowed}
      stores={stores.map((store) => ({ id: store.id, name: store.name }))}
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
        date: format(entry.date, "yyyy-MM-dd"),
        workerId: entry.userId ?? entry.employeeId ?? "",
        workerType: entry.userId ? "MANAGER" : "EMPLOYEE",
        workerName: entry.user?.username ?? entry.employee?.name ?? "Unknown worker",
      }))}
    />
  );
}
