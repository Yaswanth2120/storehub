"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { Input } from "@/frontend/components/ui/input";
import { generateTempPassword } from "@/lib/utils";
import { coOwnerSchema, managerSchema } from "@/backend/validations";

type AddUserModalProps = {
  role: "CO_OWNER" | "MANAGER";
  triggerLabel: string;
  stores: Array<{ id: string; name: string }>;
  user?: {
    id: string;
    username: string;
    pastDaysAllowed: number | null;
    storeIds: string[];
  };
};

export function AddUserModal({ role, triggerLabel, stores, user }: AddUserModalProps) {
  const router = useRouter();
  const schema = role === "MANAGER" ? managerSchema : coOwnerSchema;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: user?.username ?? "",
      password: generateTempPassword(),
      storeIds: user?.storeIds ?? [],
      ...(role === "MANAGER" ? { pastDaysAllowed: user?.pastDaysAllowed ?? 3 } : {}),
    },
  });

  useEffect(() => {
    if (!user) {
      setValue("password" as never, generateTempPassword() as never);
    }
  }, [setValue, user]);

  const selectedStores = watch("storeIds") ?? [];
  const formErrors = errors as Record<string, { message?: string }>;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/users", {
      method: user ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user ? { ...values, role, userId: user.id } : { ...values, role }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save user");
      return;
    }

    toast.success(user ? "User updated" : `${role === "MANAGER" ? "Manager" : "Co-owner"} created`);
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={user ? "outline" : "default"} size={user ? "sm" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : `Add ${role === "MANAGER" ? "manager" : "co-owner"}`}</DialogTitle>
          <DialogDescription>Assign store access and configure account restrictions.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Username</label>
            <Input {...register("username")} />
            {formErrors.username ? <p className="text-xs text-destructive">{formErrors.username.message}</p> : null}
          </div>
          {!user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Temporary password</label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setValue("password" as never, generateTempPassword() as never)}>
                  Auto-generate
                </Button>
              </div>
              <Input {...register("password" as never)} />
              {formErrors.password ? <p className="text-xs text-destructive">{formErrors.password.message}</p> : null}
            </div>
          ) : null}
          <div className="space-y-3">
            <label className="text-sm font-medium">Assigned stores</label>
            <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
              {stores.map((store) => (
                <label key={store.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedStores.includes(store.id)}
                    onCheckedChange={(checked) =>
                      setValue(
                        "storeIds",
                        checked
                          ? [...selectedStores, store.id]
                          : selectedStores.filter((id) => id !== store.id),
                        { shouldValidate: true },
                      )
                    }
                  />
                  {store.name}
                </label>
              ))}
            </div>
            {formErrors.storeIds ? <p className="text-xs text-destructive">{formErrors.storeIds.message}</p> : null}
          </div>
          {role === "MANAGER" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Past days allowed</label>
              <Input type="number" min={1} max={30} {...register("pastDaysAllowed" as never)} />
              {formErrors.pastDaysAllowed ? <p className="text-xs text-destructive">{formErrors.pastDaysAllowed.message}</p> : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : user ? "Save changes" : "Create user"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
