import bcrypt from "bcryptjs";
import { addHours, startOfDay } from "date-fns";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireRole, requireUser } from "@/backend/auth";
import {
  changePasswordSchema,
  coOwnerSchema,
  forgotPasswordSchema,
  managerSchema,
  setNewPasswordSchema,
} from "@/backend/validations";
import { generateTempPassword } from "@/lib/utils";

export async function GET() {
  await requireRole(["OWNER"]);
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["CO_OWNER", "MANAGER"],
      },
    },
    select: {
      id: true,
      username: true,
      role: true,
      pastDaysAllowed: true,
      payRate: true,
      assignedStores: {
        include: {
          store: true,
        },
      },
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const intent = searchParams.get("intent");
  const body = await request.json();

  if (intent === "forgot-password") {
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const owner = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        role: "OWNER",
        recoveryEmail: parsed.data.recoveryEmail,
      },
    });

    if (!owner?.recoveryEmail) {
      return NextResponse.json({ error: "Username and recovery email do not match" }, { status: 404 });
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: owner.id,
      },
    });

    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: owner.id,
        expiresAt: addHours(new Date(), 1),
      },
    });

    return NextResponse.json({
      success: true,
      redirectTo: `/forgot-password/reset?token=${token}`,
    });
  }

  await requireRole(["OWNER"]);

  const role = body.role;
  const parsed = role === "MANAGER" ? managerSchema.safeParse(body) : coOwnerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      password,
      role,
      mustChangePassword: false,
      pastDaysAllowed: role === "MANAGER" ? body.pastDaysAllowed : null,
      payRate: role === "MANAGER" ? Number(body.payRate) : null,
      assignedStores: {
        createMany: {
          data: parsed.data.storeIds.map((storeId) => ({ storeId })),
        },
      },
    },
  });

  if (role === "MANAGER") {
    await prisma.payRateHistory.create({
      data: {
        userId: user.id,
        oldPayRate: null,
        newPayRate: Number(body.payRate),
        effectiveDate: startOfDay(new Date()),
      },
    });
  }

  return NextResponse.json({ success: true, userId: user.id });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const intent = searchParams.get("intent");
  const body = await request.json();

  if (intent === "change-password") {
    const sessionUser = await requireUser();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(parsed.data.newPassword, 10),
      },
    });

    return NextResponse.json({ success: true });
  }

  if (intent === "owner-reset-password") {
    const parsed = setNewPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: parsed.data.token },
      include: { user: true },
    });

    if (!resetToken || resetToken.user.role !== "OWNER" || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Reset session is invalid or expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: await bcrypt.hash(parsed.data.newPassword, 10),
      },
    });

    await prisma.passwordResetToken.delete({
      where: { token: parsed.data.token },
    });

    return NextResponse.json({ success: true });
  }

  await requireRole(["OWNER"]);

  if (intent === "reset-password") {
    const nextPassword = generateTempPassword();
    await prisma.user.update({
      where: { id: body.userId },
      data: {
        password: await bcrypt.hash(nextPassword, 10),
        mustChangePassword: false,
      },
    });

    return NextResponse.json({ success: true, password: nextPassword });
  }

  const role = body.role;
  const existingUser =
    role === "MANAGER"
      ? await prisma.user.findUnique({
          where: { id: body.userId },
          select: { payRate: true },
        })
      : null;

  await prisma.user.update({
    where: { id: body.userId },
    data: {
      username: body.username,
      pastDaysAllowed: role === "MANAGER" ? Number(body.pastDaysAllowed) : null,
      payRate: role === "MANAGER" ? Number(body.payRate) : null,
      assignedStores: {
        deleteMany: {},
        createMany: {
          data: body.storeIds.map((storeId: string) => ({ storeId })),
        },
      },
    },
  });

  if (role === "MANAGER" && existingUser && existingUser.payRate !== Number(body.payRate)) {
    await prisma.payRateHistory.create({
      data: {
        userId: body.userId,
        oldPayRate: existingUser.payRate,
        newPayRate: Number(body.payRate),
        effectiveDate: startOfDay(new Date()),
      },
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  await requireRole(["OWNER"]);
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
