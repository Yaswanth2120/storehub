import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { getSettings } from "@/backend/data";
import { requireRole } from "@/backend/auth";
import { settingsSchema } from "@/backend/validations";

export async function GET() {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const settings = await getSettings();

  if (user.role === "CO_OWNER") {
    return NextResponse.json({
      ...settings,
      recoveryEmail: "",
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  await requireRole(["OWNER"]);

  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const settings = await getSettings();

  // Update SystemSettings
  await prisma.systemSettings.update({
    where: { id: settings.id },
    data: parsed.data,
  });

  // ALSO update Owner user recovery email
  if (parsed.data.recoveryEmail) {
    await prisma.user.updateMany({
      where: { role: "OWNER" },
      data: { recoveryEmail: parsed.data.recoveryEmail },
    });
  }

  return NextResponse.json({ success: true });
}
