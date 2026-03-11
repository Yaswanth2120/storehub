import { endOfDay, startOfDay } from "date-fns";
import { NextResponse } from "next/server";
import { requireRole } from "@/backend/auth";
import { prisma } from "@/backend/prisma";
import { payRateChangeSchema } from "@/backend/validations";
import { parseDateOnly } from "@/lib/utils";

export async function PATCH(request: Request) {
  await requireRole(["OWNER", "CO_OWNER"]);
  const body = await request.json();
  const parsed = payRateChangeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid pay rate change" }, { status: 400 });
  }

  const data = parsed.data;
  const today = startOfDay(new Date());
  const workerField = data.workerType === "MANAGER" ? "userId" : "employeeId";
  const effectiveDate =
    data.applyMode === "FUTURE_ONLY"
      ? startOfDay(parseDateOnly(data.effectiveStartDate!))
      : data.applyMode === "DATE_RANGE"
        ? startOfDay(parseDateOnly(data.startDate!))
        : data.applyMode === "ONE_DAY"
          ? startOfDay(parseDateOnly(data.date!))
          : today;

  const attendanceWhere =
    data.applyMode === "FUTURE_ONLY"
      ? {
          [workerField]: data.workerId,
          date: {
            gte: startOfDay(parseDateOnly(data.effectiveStartDate!)),
          },
        }
      : data.applyMode === "DATE_RANGE"
        ? {
            [workerField]: data.workerId,
            date: {
              gte: startOfDay(parseDateOnly(data.startDate!)),
              lte: endOfDay(parseDateOnly(data.endDate!)),
            },
          }
        : data.applyMode === "ONE_DAY"
          ? {
              [workerField]: data.workerId,
              date: {
                gte: startOfDay(parseDateOnly(data.date!)),
                lte: endOfDay(parseDateOnly(data.date!)),
              },
            }
          : {
              [workerField]: data.workerId,
            };

  await prisma.attendance.updateMany({
    where: attendanceWhere,
    data: {
      payRateSnapshot: data.newPayRate,
    },
  });

  const shouldUpdateCurrentRate =
    data.applyMode === "FUTURE_ONLY" ||
    data.applyMode === "ALL_RECORDS" ||
    (data.applyMode === "DATE_RANGE" && startOfDay(parseDateOnly(data.endDate!)) >= today) ||
    (data.applyMode === "ONE_DAY" && startOfDay(parseDateOnly(data.date!)) >= today);

  if (shouldUpdateCurrentRate) {
    if (data.workerType === "MANAGER") {
      const currentUser = await prisma.user.findUnique({
        where: { id: data.workerId },
        select: { payRate: true },
      });

      await prisma.user.update({
        where: { id: data.workerId },
        data: { payRate: data.newPayRate },
      });

      if (currentUser?.payRate !== data.newPayRate) {
        await prisma.payRateHistory.create({
          data: {
            userId: data.workerId,
            oldPayRate: currentUser?.payRate ?? null,
            newPayRate: data.newPayRate,
            effectiveDate,
          },
        });
      }
    } else {
      const currentEmployee = await prisma.employee.findUnique({
        where: { id: data.workerId },
        select: { payRate: true },
      });

      await prisma.employee.update({
        where: { id: data.workerId },
        data: { payRate: data.newPayRate },
      });

      if (currentEmployee?.payRate !== data.newPayRate) {
        await prisma.payRateHistory.create({
          data: {
            employeeId: data.workerId,
            oldPayRate: currentEmployee?.payRate ?? null,
            newPayRate: data.newPayRate,
            effectiveDate,
          },
        });
      }
    }
  } else {
    await prisma.payRateHistory.create({
      data:
        data.workerType === "MANAGER"
          ? {
              userId: data.workerId,
              oldPayRate: data.currentPayRate,
              newPayRate: data.newPayRate,
              effectiveDate,
            }
          : {
              employeeId: data.workerId,
              oldPayRate: data.currentPayRate,
              newPayRate: data.newPayRate,
              effectiveDate,
            },
    });
  }

  return NextResponse.json({ success: true });
}
