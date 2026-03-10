import { requireRole } from "@/backend/auth";
import { getSettings } from "@/backend/data";
import { SettingsClient } from "@/frontend/components/pages/settings-client";

export default async function SettingsPage() {
  const user = await requireRole(["OWNER", "CO_OWNER"]);
  const settings = await getSettings();

  return (
    <SettingsClient
      readOnly={user.role === "CO_OWNER"}
      settings={{
        companyName: settings.companyName,
        recoveryEmail: settings.recoveryEmail ?? "",
        timezone: settings.timezone,
        notes: settings.notes ?? "",
      }}
    />
  );
}
