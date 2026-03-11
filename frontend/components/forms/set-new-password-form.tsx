"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { setNewPasswordSchema } from "@/backend/validations";

type SetNewPasswordValues = z.infer<typeof setNewPasswordSchema>;

export function SetNewPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetNewPasswordValues>({
    resolver: zodResolver(setNewPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/users?intent=owner-reset-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to reset password");
      return;
    }

    toast.success("Password reset successfully");
    router.push("/login");
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Create a new Owner password and return to login.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" {...register("token")} />
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
            {loading ? "Saving..." : "Set new password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
