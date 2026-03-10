import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";
import { getSettings } from "@/backend/data";
import { requireRole } from "@/backend/auth";
import { settingsSchema } from "@/backend/validations";

export async function GET() {
  await requireRole(["OWNER", "CO_OWNER"]);
  return NextResponse.json(await getSettings());
}

export async function PATCH(request: Request) {
  await requireRole(["OWNER"]);
  const body = await request.json();
  const parsed = settingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const settings = await getSettings();

  await prisma.systemSettings.update({
    where: { id: settings.id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true });
}
