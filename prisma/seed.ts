import bcrypt from "bcryptjs";
import { set, subDays } from "date-fns";
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

  const [ownerPassword, tempPassword, managerPassword] = await Promise.all([
    bcrypt.hash("owner123", 10),
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
      password: tempPassword,
      role: "CO_OWNER",
      mustChangePassword: true,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      username: "sarah.j",
      password: tempPassword,
      role: "MANAGER",
      mustChangePassword: true,
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

  const emmaRaiseDate = subDays(new Date(), 2);
  const sarahRaiseDate = subDays(new Date(), 1);

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
        effectiveDate: subDays(new Date(), 30),
      },
      {
        employeeId: employees[2].id,
        oldPayRate: null,
        newPayRate: 20,
        effectiveDate: subDays(new Date(), 30),
      },
      {
        employeeId: employees[3].id,
        oldPayRate: null,
        newPayRate: 17.5,
        effectiveDate: subDays(new Date(), 30),
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
        effectiveDate: subDays(new Date(), 30),
      },
    ],
  });

  const attendanceData = Array.from({ length: 7 }).flatMap((_, index) => {
    const date = subDays(new Date(), index);
    const workDate = set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 });
    const emmaPayRate = workDate >= set(emmaRaiseDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) ? 18.5 : 17;
    const sarahPayRate = workDate >= set(sarahRaiseDate, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 }) ? 21 : 20;

    return [
      {
        employeeId: employees[0].id,
        storeId: stores[0].id,
        date: workDate,
        clockIn: "09:00",
        clockOut: "17:00",
        totalHours: 8,
        payRateSnapshot: emmaPayRate,
      },
      {
        employeeId: employees[1].id,
        storeId: stores[0].id,
        date: workDate,
        clockIn: "10:00",
        clockOut: "18:30",
        totalHours: 8.5,
        payRateSnapshot: 19,
      },
      {
        employeeId: employees[2].id,
        storeId: stores[1].id,
        date: workDate,
        clockIn: "08:30",
        clockOut: "16:30",
        totalHours: 8,
        payRateSnapshot: 20,
      },
      {
        userId: sarah.id,
        storeId: stores[0].id,
        date: workDate,
        clockIn: "12:00",
        clockOut: "18:00",
        totalHours: 6,
        payRateSnapshot: sarahPayRate,
      },
      {
        userId: michael.id,
        storeId: stores[1].id,
        date: workDate,
        clockIn: "11:00",
        clockOut: "17:00",
        totalHours: 6,
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
