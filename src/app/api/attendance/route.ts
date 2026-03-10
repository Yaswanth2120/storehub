import { differenceInCalendarDays, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { canAccessStore, requireRole, requireUser } from "@/backend/auth";
import { attendanceSchema } from "@/backend/validations";

function isAllowedManagerDate(target: Date, pastDaysAllowed: number | null) {
  if (!pastDaysAllowed) {
    return false;
  }

  const today = startOfDay(new Date());
  const diff = differenceInCalendarDays(today, startOfDay(target));
  return diff >= 0 && diff <= pastDaysAllowed;
}

export async function POST(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER", "MANAGER"]);
  const body = await request.json();
  const parsed = attendanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!canAccessStore(user, parsed.data.storeId)) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  const targetDate = new Date(parsed.data.date);

  if (user.role === "MANAGER" && !isAllowedManagerDate(targetDate, user.pastDaysAllowed)) {
    return NextResponse.json({ error: "Attendance date is outside your allowed range" }, { status: 403 });
  }

  await prisma.attendance.create({
    data: {
      employeeId: parsed.data.employeeId,
      storeId: parsed.data.storeId,
      date: targetDate,
      clockIn: parsed.data.clockIn,
      clockOut: parsed.data.clockOut,
      totalHours: parsed.data.totalHours,
    },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const body = await request.json();

  if (!body.attendanceId) {
    return NextResponse.json({ error: "Attendance id is required" }, { status: 400 });
  }

  if (!canAccessStore(user, body.storeId)) {
    return NextResponse.json({ error: "Store access denied" }, { status: 403 });
  }

  await prisma.attendance.update({
    where: { id: body.attendanceId },
    data: {
      employeeId: body.employeeId,
      storeId: body.storeId,
      date: new Date(body.date),
      clockIn: body.clockIn,
      clockOut: body.clockOut,
      totalHours: Number(body.totalHours),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const { searchParams } = new URL(request.url);
  const attendanceId = searchParams.get("attendanceId");

  if (!attendanceId) {
    return NextResponse.json({ error: "Attendance id is required" }, { status: 400 });
  }

  const attendance = await prisma.attendance.findUnique({ where: { id: attendanceId } });

  if (!attendance || !canAccessStore(user, attendance.storeId)) {
    return NextResponse.json({ error: "Attendance entry not found" }, { status: 404 });
  }

  await prisma.attendance.delete({ where: { id: attendanceId } });
  return NextResponse.json({ success: true });
}

export async function GET() {
  const user = await requireUser();
  const records = await prisma.attendance.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            storeId: {
              in: user.assignedStores,
            },
          },
    include: {
      employee: true,
      store: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  return NextResponse.json(records);
}
