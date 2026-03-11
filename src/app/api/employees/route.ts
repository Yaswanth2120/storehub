import { startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { canAccessStore, requireRole, requireUser } from "@/backend/auth";
import { employeeSchema } from "@/backend/validations";

export async function POST(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const body = await request.json();
  const parsed = employeeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!canAccessStore(user, parsed.data.storeId)) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  const employee = await prisma.employee.create({ data: parsed.data });
  await prisma.payRateHistory.create({
    data: {
      employeeId: employee.id,
      oldPayRate: null,
      newPayRate: parsed.data.payRate,
      effectiveDate: startOfDay(new Date()),
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const body = await request.json();
  const parsed = employeeSchema.extend({ employeeId: employeeSchema.shape.storeId }).safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid employee payload" }, { status: 400 });
  }

  if (!canAccessStore(user, body.storeId)) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  const currentEmployee = await prisma.employee.findUnique({
    where: { id: body.employeeId },
    select: { payRate: true },
  });

  await prisma.employee.update({
    where: { id: body.employeeId },
    data: {
      name: body.name,
      storeId: body.storeId,
      status: body.status,
      payRate: Number(body.payRate),
    },
  });

  if (currentEmployee && currentEmployee.payRate !== Number(body.payRate)) {
    await prisma.payRateHistory.create({
      data: {
        employeeId: body.employeeId,
        oldPayRate: currentEmployee.payRate,
        newPayRate: Number(body.payRate),
        effectiveDate: startOfDay(new Date()),
      },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json({ error: "Employee id is required" }, { status: 400 });
  }

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });

  if (!employee || !canAccessStore(user, employee.storeId)) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  await prisma.employee.delete({ where: { id: employeeId } });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const user = await requireUser();
  const employees = await prisma.employee.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            storeId: {
              in: user.assignedStores,
            },
          },
    include: {
      store: true,
    },
  });

  return NextResponse.json(employees);
}
