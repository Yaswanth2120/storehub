"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, User2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { loginSchema } from "@/backend/validations";

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      toast.error("Invalid username or password");
      return;
    }

    router.push("/stores");
    router.refresh();
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
          S
        </div>
        <div>
          <CardTitle>StoreHub</CardTitle>
          <CardDescription>Sign in to manage stores, employees, and attendance.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <div className="relative">
              <User2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Enter username" {...register("username")} />
            </div>
            {errors.username ? <p className="text-xs text-destructive">{errors.username.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input type="password" className="pl-9" placeholder="Enter password" {...register("password")} />
            </div>
            {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
          </div>
          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="rounded-xl border bg-slate-50 p-4 text-sm">
          <p className="font-semibold">Demo credentials</p>
          <div className="mt-3 space-y-1 text-muted-foreground">
            <p>`Sapin / Owner123`</p>
            <p>`Rochan / Coowner123`</p>
            <p>`Manager1 / Manager123`</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
