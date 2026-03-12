import { requireRole } from "@/backend/auth";
import { getPayrollForUser, getStoresForUser } from "@/backend/data";
import { PayrollClient } from "@/frontend/components/pages/payroll-client";

export default async function PayrollPage() {

  const user = await requireRole(["OWNER", "CO_OWNER"]);

  const [payroll, stores] = await Promise.all([
    getPayrollForUser(user),
    getStoresForUser(user),
  ]);

  return (
    <PayrollClient
      payroll={payroll}
      stores={stores.map((store) => ({
        id: store.id,
        name: store.name,
      }))}
    />
  );
}