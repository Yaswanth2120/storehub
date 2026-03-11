"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/components/ui/dialog";
import { Input } from "@/frontend/components/ui/input";

type ResetPasswordModalProps = {
  userId: string;
};

export function ResetPasswordModal({ userId }: ResetPasswordModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function handleReset() {
    setLoading(true);
    const response = await fetch("/api/users?intent=reset-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to reset password");
      return;
    }

    setPassword(data.password);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Reset Password</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>Generate a temporary password to share with the user.</DialogDescription>
        </DialogHeader>
        {password ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Temporary password</label>
            <Input readOnly value={password} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Share this temporary password with the user. They can change it later from the Settings page if they want.</p>
        )}
        <DialogFooter>
          <Button type="button" onClick={handleReset} disabled={loading}>
            {loading ? "Resetting..." : password ? "Generate again" : "Generate password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
