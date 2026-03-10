"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { forgotPasswordSchema } from "@/backend/validations";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/users?intent=forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to process request");
      return;
    }

    setSuccess(data.message);
    toast.success("Recovery email queued");
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Only the Owner account can receive a recovery link.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input placeholder="Enter the owner username" {...register("username")} />
            {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Send reset link"}
          </Button>
        </form>
        {success ? <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div> : null}
        <Link href="/login" className="block text-sm font-medium text-primary hover:underline">
          Back to login
        </Link>
      </CardContent>
    </Card>
  );
}
