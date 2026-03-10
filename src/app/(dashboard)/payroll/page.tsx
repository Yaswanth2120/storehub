import { format, subDays } from "date-fns";
import { requireRole } from "@/backend/auth";
import { getPayrollForUser, getStoresForUser } from "@/backend/data";
import { PayrollClient } from "@/frontend/components/pages/payroll-client";

export default async function PayrollPage() {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const [payroll, stores] = await Promise.all([getPayrollForUser(user), getStoresForUser(user)]);
  const defaultTo = format(new Date(), "yyyy-MM-dd");
  const defaultFrom = format(subDays(new Date(), 13), "yyyy-MM-dd");

  return (
    <PayrollClient
      payroll={payroll}
      stores={stores.map((store) => ({ id: store.id, name: store.name }))}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
    />
  );
}
