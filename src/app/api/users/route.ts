import bcrypt from "bcryptjs";
import { addHours } from "date-fns";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { requireRole, requireUser } from "@/backend/auth";
import {
  changePasswordSchema,
  coOwnerSchema,
  forgotPasswordSchema,
  managerSchema,
} from "@/backend/validations";
import { generateTempPassword, maskEmail } from "@/lib/utils";

export async function GET() {
  await requireRole(["OWNER"]);
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: ["CO_OWNER", "MANAGER"],
      },
    },
    include: {
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
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const owner = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        role: "OWNER",
        recoveryEmail: { not: null },
      },
    });

    if (!owner?.recoveryEmail) {
      return NextResponse.json({ error: "Owner recovery email not found" }, { status: 404 });
    }

    const token = randomUUID();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: owner.id,
        expiresAt: addHours(new Date(), 1),
      },
    });

    console.info(`StoreHub password reset link: ${process.env.NEXTAUTH_URL}/change-password?token=${token}`);

    return NextResponse.json({
      success: true,
      message: `A reset link was sent to ${maskEmail(owner.recoveryEmail)}.`,
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
      mustChangePassword: true,
      pastDaysAllowed: role === "MANAGER" ? body.pastDaysAllowed : null,
      assignedStores: {
        createMany: {
          data: parsed.data.storeIds.map((storeId) => ({ storeId })),
        },
      },
    },
  });

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
        mustChangePassword: false,
      },
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
        mustChangePassword: true,
      },
    });

    return NextResponse.json({ success: true, password: nextPassword });
  }

  const role = body.role;
  await prisma.user.update({
    where: { id: body.userId },
    data: {
      username: body.username,
      pastDaysAllowed: role === "MANAGER" ? Number(body.pastDaysAllowed) : null,
      assignedStores: {
        deleteMany: {},
        createMany: {
          data: body.storeIds.map((storeId: string) => ({ storeId })),
        },
      },
    },
  });

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
