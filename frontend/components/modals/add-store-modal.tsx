"use client";

import { useState } from "react";
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
import { storeSchema } from "@/backend/validations";

type AddStoreModalProps = {
  triggerLabel: string;
  store?: {
    id: string;
    name: string;
    address: string;
    managerIds: string[];
  };
  managers: Array<{ id: string; username: string }>;
};

export function AddStoreModal({ triggerLabel, store, managers }: AddStoreModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: store?.name ?? "",
      address: store?.address ?? "",
      managerIds: store?.managerIds ?? [],
    },
  });

  const selectedManagers = watch("managerIds") ?? [];

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/stores", {
      method: store ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store ? { ...values, storeId: store.id } : values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save store");
      return;
    }

    toast.success(store ? "Store updated" : "Store created");
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={store ? "outline" : "default"} size={store ? "sm" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{store ? "Edit store" : "Add store"}</DialogTitle>
          <DialogDescription>Update store details and assign managers.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Store name</label>
            <Input {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input {...register("address")} />
            {errors.address ? <p className="text-xs text-destructive">{errors.address.message}</p> : null}
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium">Assign managers</label>
            <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
              {managers.map((manager) => (
                <label key={manager.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedManagers.includes(manager.id)}
                    onCheckedChange={(checked) =>
                      setValue(
                        "managerIds",
                        checked
                          ? [...selectedManagers, manager.id]
                          : selectedManagers.filter((id) => id !== manager.id),
                        { shouldValidate: true },
                      )
                    }
                  />
                  {manager.username}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : store ? "Save changes" : "Create store"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
