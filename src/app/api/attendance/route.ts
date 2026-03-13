import { format } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireRole, requireUser } from "@/backend/auth";
import { attendanceSchema } from "@/backend/validations";
import { isDateInManagerAllowedWeeks, parseDateOnly } from "@/lib/utils";

async function userCanAccessStore(userId: string, role: string, storeId: string) {
  if (role === "OWNER") return true;

  const access = await prisma.storeUser.findFirst({
    where: {
      userId,
      storeId,
    },
  });

  return !!access;
}

function isAllowedManagerDate(target: Date) {
  return isDateInManagerAllowedWeeks(target);
}

export async function POST(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER", "MANAGER"]);
  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const allowed = await userCanAccessStore(user.id, user.role, parsed.data.storeId);

  if (!allowed) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  const targetDate = parseDateOnly(parsed.data.weekStart);

  if (user.role === "MANAGER" && !isAllowedManagerDate(targetDate)) {
    return NextResponse.json(
      { error: "Managers can work only inside the two most recent completed weeks" },
      { status: 403 }
    );
  }

  const payRateSnapshot =
    parsed.data.workerType === "MANAGER"
      ? (
          await prisma.user.findUnique({
            where: { id: parsed.data.workerId },
            select: { payRate: true },
          })
        )?.payRate ?? 0
      : (
          await prisma.employee.findUnique({
            where: { id: parsed.data.workerId },
            select: { payRate: true },
          })
        )?.payRate ?? 0;

  const duplicate = await prisma.attendance.findFirst({
    where: {
      employeeId: parsed.data.workerType === "EMPLOYEE" ? parsed.data.workerId : null,
      userId: parsed.data.workerType === "MANAGER" ? parsed.data.workerId : null,
      storeId: parsed.data.storeId,
      date: targetDate,
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Weekly attendance already exists for this worker and store. Edit the existing record instead." },
      { status: 400 }
    );
  }

  await prisma.attendance.create({
    data: {
      employeeId: parsed.data.workerType === "EMPLOYEE" ? parsed.data.workerId : null,
      userId: parsed.data.workerType === "MANAGER" ? parsed.data.workerId : null,
      storeId: parsed.data.storeId,
      date: targetDate,
      clockIn: "00:00",
      clockOut: "00:00",
      totalHours: parsed.data.totalHours,
      payRateSnapshot,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER", "MANAGER"]);
  const body = await request.json();

  if (!body.attendanceId) {
    return NextResponse.json(
      { error: "Attendance id is required" },
      { status: 400 }
    );
  }

  const allowed = await userCanAccessStore(user.id, user.role, body.storeId);

  if (!allowed) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  const targetDate = parseDateOnly(body.weekStart);

  if (user.role === "MANAGER" && !isAllowedManagerDate(targetDate)) {
    return NextResponse.json(
      { error: "Managers can work only inside the two most recent completed weeks" },
      { status: 403 }
    );
  }

  await prisma.attendance.update({
    where: { id: body.attendanceId },
    data: {
      employeeId: body.workerType === "EMPLOYEE" ? body.workerId : null,
      userId: body.workerType === "MANAGER" ? body.workerId : null,
      storeId: body.storeId,
      date: targetDate,
      clockIn: "00:00",
      clockOut: "00:00",
      totalHours: Number(body.totalHours),
      payRateSnapshot:
        body.workerType === "MANAGER"
          ? (
              await prisma.user.findUnique({
                where: { id: body.workerId },
                select: { payRate: true },
              })
            )?.payRate ?? 0
          : (
              await prisma.employee.findUnique({
                where: { id: body.workerId },
                select: { payRate: true },
              })
            )?.payRate ?? 0,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const { searchParams } = new URL(request.url);
  const attendanceId = searchParams.get("attendanceId");

  if (!attendanceId) {
    return NextResponse.json(
      { error: "Attendance id is required" },
      { status: 400 }
    );
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
  });

  if (!attendance) {
    return NextResponse.json(
      { error: "Attendance entry not found" },
      { status: 404 }
    );
  }

  const allowed = await userCanAccessStore(user.id, user.role, attendance.storeId);

  if (!allowed) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  await prisma.attendance.delete({
    where: { id: attendanceId },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const user = await requireUser();

  const records = await prisma.attendance.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            store: {
              users: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
    include: {
      employee: true,
      user: {
        select: {
          id: true,
          username: true,
          role: true,
        },
      },
      store: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(
    records.map((record) => ({
      ...record,
      weekStart: format(record.date, "yyyy-MM-dd"),
    }))
  );
}
