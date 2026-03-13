"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { changePasswordSchema, settingsSchema } from "@/backend/validations";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";

type SettingsValues = z.infer<typeof settingsSchema>;
type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

type SettingsClientProps = {
  role: string;
  readOnly: boolean;
  settings: SettingsValues;
};

export function SettingsClient({ role, readOnly, settings }: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save settings");
      return;
    }

    toast.success("Settings updated");
    router.refresh();
  });

  const onPasswordSubmit = handleSubmitPassword(async (values) => {
    setPasswordLoading(true);
    const response = await fetch("/api/users?intent=change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setPasswordLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to change password");
      return;
    }

    resetPasswordForm();
    toast.success("Password updated");
  });

  const settingsDescription =
    role === "OWNER"
      ? "Configure the system profile, recovery contact, and internal operating notes."
      : role === "MANAGER"
        ? "Managers can update their own password here. Company settings remain restricted."
        : "Co-Owners can update their own password here. Company settings remain restricted.";

  return (
    <div className="space-y-6">
      <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">Settings</CardTitle>
          <p className="max-w-2xl text-[15px] leading-6 text-[#6e6e73]">{settingsDescription}</p>
        </CardHeader>

        <CardContent className="space-y-5 p-7 pt-0">
          <div className={role === "OWNER" ? "grid gap-4 md:grid-cols-3" : "grid gap-4 md:grid-cols-2"}>
            <div className="rounded-[24px] border border-[#e5e5ea] bg-[#fbfbfd] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Company</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#1d1d1f]">{settings.companyName}</p>
            </div>
            {role === "OWNER" ? (
              <div className="rounded-[24px] border border-[#e5e5ea] bg-[#fbfbfd] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Recovery Email</p>
                <p className="mt-2 text-base font-medium text-[#1d1d1f]">{settings.recoveryEmail}</p>
              </div>
            ) : null}
            <div className="rounded-[24px] border border-[#e5e5ea] bg-[#fbfbfd] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Access Mode</p>
              <p className="mt-2 text-base font-medium text-[#1d1d1f]">{readOnly ? "Read Only" : "Editable"}</p>
            </div>
          </div>

          {role === "OWNER" ? (
            <div className="rounded-[24px] border border-[#e5e5ea] bg-white p-6">
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#3a3a3c]">Company name</label>
                    <Input disabled={readOnly} {...register("companyName")} />
                    {errors.companyName ? <p className="text-xs text-destructive">{errors.companyName.message}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#3a3a3c]">Recovery email</label>
                    <Input disabled={readOnly} {...register("recoveryEmail")} />
                    {errors.recoveryEmail ? <p className="text-xs text-destructive">{errors.recoveryEmail.message}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#3a3a3c]">Notes</label>
                  <Textarea disabled={readOnly} {...register("notes")} />
                </div>

                <Button disabled={readOnly || loading} type="submit">
                  {loading ? "Saving..." : "Save settings"}
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-[24px] border border-[#d7e3ff] bg-[#f4f7ff] px-5 py-4 text-sm text-[#445274]">
              <Sparkles className="h-5 w-5 text-[#0071e3]" />
              Company settings are reserved for owners. You can still update your personal account password below.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="text-[1.7rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
            Change Password
          </CardTitle>
          <p className="text-[15px] leading-6 text-[#6e6e73]">
            Update your account password using the current password you sign in with today.
          </p>
        </CardHeader>

        <CardContent className="p-7 pt-0">
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3a3a3c]">Current Password</label>
                <Input type="password" {...registerPassword("currentPassword")} />
                {passwordErrors.currentPassword ? (
                  <p className="text-xs text-destructive">{passwordErrors.currentPassword.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3a3a3c]">New Password</label>
                <Input type="password" {...registerPassword("newPassword")} />
                {passwordErrors.newPassword ? (
                  <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#3a3a3c]">Confirm New Password</label>
                <Input type="password" {...registerPassword("confirmNewPassword")} />
                {passwordErrors.confirmNewPassword ? (
                  <p className="text-xs text-destructive">{passwordErrors.confirmNewPassword.message}</p>
                ) : null}
              </div>
            </div>

            <Button disabled={passwordLoading} type="submit">
              {passwordLoading ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
