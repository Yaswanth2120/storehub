import bcrypt from "bcryptjs";
import { startOfDay, subDays, subWeeks } from "date-fns";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.passwordResetToken.deleteMany();
  await prisma.payRateHistory.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.storeUser.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSettings.deleteMany();

  const [ownerPassword, coOwnerPassword, tempPassword, managerPassword] = await Promise.all([
    bcrypt.hash("owner123", 10),
    bcrypt.hash("coowner123", 10),
    bcrypt.hash("temp123", 10),
    bcrypt.hash("manager123", 10),
  ]);

  const stores = await Promise.all([
    prisma.store.create({ data: { name: "Downtown Store", address: "123 Main St" } }),
    prisma.store.create({ data: { name: "Westside Location", address: "456 Oak Ave" } }),
    prisma.store.create({ data: { name: "Northgate Branch", address: "789 Pine Rd" } }),
  ]);

  const owner = await prisma.user.create({
    data: {
      username: "owner",
      password: ownerPassword,
      role: "OWNER",
      recoveryEmail: "owner@storehub.dev",
      mustChangePassword: false,
    },
  });

  const coOwner = await prisma.user.create({
    data: {
      username: "coowner1",
      password: coOwnerPassword,
      role: "CO_OWNER",
      mustChangePassword: false,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      username: "sarah.j",
      password: tempPassword,
      role: "MANAGER",
      mustChangePassword: false,
      pastDaysAllowed: 3,
      payRate: 21,
    },
  });

  const michael = await prisma.user.create({
    data: {
      username: "michael.c",
      password: managerPassword,
      role: "MANAGER",
      mustChangePassword: false,
      pastDaysAllowed: 2,
      payRate: 22.5,
    },
  });

  await prisma.storeUser.createMany({
    data: [
      { userId: coOwner.id, storeId: stores[0].id },
      { userId: coOwner.id, storeId: stores[1].id },
      { userId: sarah.id, storeId: stores[0].id },
      { userId: michael.id, storeId: stores[1].id },
    ],
  });

  const employees = await Promise.all([
    prisma.employee.create({
      data: { name: "Emma Reed", storeId: stores[0].id, status: "Active", payRate: 18.5 },
    }),
    prisma.employee.create({
      data: { name: "Jordan Patel", storeId: stores[0].id, status: "Active", payRate: 19 },
    }),
    prisma.employee.create({
      data: { name: "Olivia Brooks", storeId: stores[1].id, status: "Active", payRate: 20 },
    }),
    prisma.employee.create({
      data: { name: "Ethan Ross", storeId: stores[2].id, status: "Inactive", payRate: 17.5 },
    }),
  ]);

  const today = new Date();
  const currentWeekStart = (() => {
    const weekStart = new Date(today);
    const day = weekStart.getDay();
    const diff = day >= 6 ? day - 6 : day + 1;
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - diff);
    return weekStart;
  })();

  const emmaRaiseDate = currentWeekStart;
  const sarahRaiseDate = currentWeekStart;

  await prisma.payRateHistory.createMany({
    data: [
      {
        employeeId: employees[0].id,
        oldPayRate: 17,
        newPayRate: 18.5,
        effectiveDate: emmaRaiseDate,
      },
      {
        employeeId: employees[1].id,
        oldPayRate: null,
        newPayRate: 19,
        effectiveDate: subDays(today, 30),
      },
      {
        employeeId: employees[2].id,
        oldPayRate: null,
        newPayRate: 20,
        effectiveDate: subDays(today, 30),
      },
      {
        employeeId: employees[3].id,
        oldPayRate: null,
        newPayRate: 17.5,
        effectiveDate: subDays(today, 30),
      },
      {
        userId: sarah.id,
        oldPayRate: 20,
        newPayRate: 21,
        effectiveDate: sarahRaiseDate,
      },
      {
        userId: michael.id,
        oldPayRate: null,
        newPayRate: 22.5,
        effectiveDate: subDays(today, 30),
      },
    ],
  });

  const weekStarts = [currentWeekStart, subWeeks(currentWeekStart, 1), subWeeks(currentWeekStart, 2), subWeeks(currentWeekStart, 3)];

  const attendanceData = weekStarts.flatMap((weekStart, index) => {
    const workWeekStart = startOfDay(weekStart);
    const emmaPayRate = workWeekStart >= startOfDay(emmaRaiseDate) ? 18.5 : 17;
    const sarahPayRate = workWeekStart >= startOfDay(sarahRaiseDate) ? 21 : 20;

    return [
      {
        employeeId: employees[0].id,
        storeId: stores[0].id,
        date: workWeekStart,
        clockIn: "00:00",
        clockOut: "00:00",
        totalHours: [48, 46, 44, 42][index] ?? 40,
        payRateSnapshot: emmaPayRate,
      },
      {
        employeeId: employees[1].id,
        storeId: stores[0].id,
        date: workWeekStart,
        clockIn: "00:00",
        clockOut: "00:00",
        totalHours: [51, 49, 47, 46][index] ?? 45,
        payRateSnapshot: 19,
      },
      {
        employeeId: employees[2].id,
        storeId: stores[1].id,
        date: workWeekStart,
        clockIn: "00:00",
        clockOut: "00:00",
        totalHours: [45, 44, 43, 42][index] ?? 40,
        payRateSnapshot: 20,
      },
      {
        userId: sarah.id,
        storeId: stores[0].id,
        date: workWeekStart,
        clockIn: "00:00",
        clockOut: "00:00",
        totalHours: [18, 16, 14, 12][index] ?? 10,
        payRateSnapshot: sarahPayRate,
      },
      {
        userId: michael.id,
        storeId: stores[1].id,
        date: workWeekStart,
        clockIn: "00:00",
        clockOut: "00:00",
        totalHours: [20, 19, 18, 17][index] ?? 15,
        payRateSnapshot: 22.5,
      },
    ];
  });

  await prisma.attendance.createMany({ data: attendanceData });

  await prisma.systemSettings.create({
    data: {
      companyName: "StoreHub Operations",
      recoveryEmail: owner.recoveryEmail,
      timezone: "America/Chicago",
      notes: "Demo system configured for multi-store retail operations.",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
