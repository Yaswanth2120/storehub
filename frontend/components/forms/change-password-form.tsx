"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { changePasswordSchema } from "@/backend/validations";

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/users?intent=change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Password update failed");
      return;
    }

    await update({
      user: {
        mustChangePassword: false,
      },
    });

    toast.success("Password updated");
    router.push("/stores");
    router.refresh();
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Set a secure password before continuing to StoreHub.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current password</label>
            <Input type="password" {...register("currentPassword")} />
            {errors.currentPassword ? <p className="text-xs text-destructive">{errors.currentPassword.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New password</label>
            <Input type="password" {...register("newPassword")} />
            {errors.newPassword ? <p className="text-xs text-destructive">{errors.newPassword.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm new password</label>
            <Input type="password" {...register("confirmNewPassword")} />
            {errors.confirmNewPassword ? <p className="text-xs text-destructive">{errors.confirmNewPassword.message}</p> : null}
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
