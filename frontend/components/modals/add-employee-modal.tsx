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
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { employeeSchema } from "@/backend/validations";

type AddEmployeeModalProps = {
  triggerLabel: string;
  stores: Array<{ id: string; name: string }>;
  employee?: {
    id: string;
    name: string;
    storeId: string;
    status: string;
    payRate: number;
  };
};

export function AddEmployeeModal({ triggerLabel, stores, employee }: AddEmployeeModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee?.name ?? "",
      storeId: employee?.storeId ?? stores[0]?.id ?? "",
      status: (employee?.status ?? "Active") as "Active" | "Inactive",
      payRate: employee?.payRate ?? 18,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/employees", {
      method: employee ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee ? { ...values, employeeId: employee.id } : values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save employee");
      return;
    }

    toast.success(employee ? "Employee updated" : "Employee created");
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={employee ? "outline" : "default"} size={employee ? "sm" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{employee ? "Edit employee" : "Add employee"}</DialogTitle>
          <DialogDescription>Capture employee details and store assignment.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input {...register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Assigned store</label>
            <Select value={watch("storeId")} onValueChange={(value) => setValue("storeId", value, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.storeId ? <p className="text-xs text-destructive">{errors.storeId.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value as "Active" | "Inactive", { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay rate ($/hr)</label>
              <Input type="number" step="0.01" {...register("payRate")} />
              {errors.payRate ? <p className="text-xs text-destructive">{errors.payRate.message}</p> : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : employee ? "Save changes" : "Create employee"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
