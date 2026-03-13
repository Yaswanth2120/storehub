import { NextResponse } from "next/server";
import { getPayrollForUser } from "@/backend/data";
import { requireRole } from "@/backend/auth";

export async function GET(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const periodType = searchParams.get("periodType") as "WEEKLY" | "BI_WEEKLY" | null;
  const periodStart = searchParams.get("periodStart") ?? undefined;
  const payroll = await getPayrollForUser(user, {
    from,
    to,
    periodType: periodType ?? undefined,
    periodStart,
  });
  return NextResponse.json(payroll);
}
