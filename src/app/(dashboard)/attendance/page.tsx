import { requireUser } from "@/backend/auth";
import { getAttendanceForUser, getEmployeesForUser, getStoresForUser } from "@/backend/data";
import { AttendanceClient } from "@/frontend/components/pages/attendance-client";

export default async function AttendancePage() {
  const user = await requireUser();
  const [attendance, employees, stores] = await Promise.all([
    getAttendanceForUser(user),
    getEmployeesForUser(user),
    getStoresForUser(user),
  ]);

  return (
    <AttendanceClient
      role={user.role}
      pastDaysAllowed={user.pastDaysAllowed}
      stores={stores.map((store) => ({ id: store.id, name: store.name }))}
      employees={employees.map((employee) => ({ id: employee.id, name: employee.name, storeId: employee.storeId }))}
      attendance={attendance.map((entry) => ({ ...entry, date: entry.date.toISOString() }))}
    />
  );
}
