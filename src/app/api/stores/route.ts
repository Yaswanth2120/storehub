import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { canAccessStore, requireRole, requireUser } from "@/backend/auth";
import { storeSchema } from "@/backend/validations";

export async function POST(request: Request) {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const body = await request.json();
  const parsed = storeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const store = await prisma.store.create({
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
    },
  });

  if (user.role === "CO_OWNER") {
    await prisma.storeUser.create({
      data: {
        userId: user.id,
        storeId: store.id,
      },
    });
  }

  if (user.role === "OWNER" && parsed.data.managerIds.length > 0) {
    await prisma.storeUser.createMany({
      data: parsed.data.managerIds.map((managerId) => ({
        userId: managerId,
        storeId: store.id,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  await requireRole(["OWNER"]);
  const body = await request.json();
  const parsed = storeSchema.safeParse(body);

  if (!parsed.success || !body.storeId) {
    return NextResponse.json({ error: "Invalid store payload" }, { status: 400 });
  }

  await prisma.store.update({
    where: { id: body.storeId },
    data: {
      name: parsed.data.name,
      address: parsed.data.address,
    },
  });

  await prisma.storeUser.deleteMany({
    where: {
      storeId: body.storeId,
      user: {
        role: "MANAGER",
      },
    },
  });

  if (parsed.data.managerIds?.length) {
    await prisma.storeUser.createMany({
      data: parsed.data.managerIds.map((managerId) => ({
        userId: managerId,
        storeId: body.storeId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  await requireRole(["OWNER"]);
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "Store id is required" }, { status: 400 });
  }

  await prisma.store.delete({
    where: {
      id: storeId,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const user = await requireUser();
  const stores = await prisma.store.findMany({
    where:
      user.role === "OWNER"
        ? undefined
        : {
            id: {
              in: user.assignedStores,
            },
          },
    include: {
      employees: true,
      users: {
        include: {
          user: true,
        },
      },
    },
  });

  return NextResponse.json(
    stores.filter((store) => canAccessStore(user, store.id)),
  );
}
