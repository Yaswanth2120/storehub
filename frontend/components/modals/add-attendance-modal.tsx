"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subDays } from "date-fns";
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
import { calculateHours } from "@/lib/utils";
import { attendanceSchema } from "@/backend/validations";

type AddAttendanceModalProps = {
  triggerLabel: string;
  stores: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string; storeId: string }>;
  role: string;
  pastDaysAllowed: number | null;
  attendance?: {
    id: string;
    employeeId: string;
    storeId: string;
    date: string;
    clockIn: string;
    clockOut: string;
    totalHours: number;
  };
};

export function AddAttendanceModal({
  triggerLabel,
  stores,
  employees,
  role,
  pastDaysAllowed,
  attendance,
}: AddAttendanceModalProps) {
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
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      employeeId: attendance?.employeeId ?? "",
      storeId: attendance?.storeId ?? stores[0]?.id ?? "",
      date: attendance?.date ? format(new Date(attendance.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      clockIn: attendance?.clockIn ?? "09:00",
      clockOut: attendance?.clockOut ?? "17:00",
      totalHours: attendance?.totalHours ?? 8,
    },
  });

  const storeId = watch("storeId");
  const clockIn = watch("clockIn");
  const clockOut = watch("clockOut");
  const totalHours = useMemo(() => calculateHours(clockIn, clockOut), [clockIn, clockOut]);

  useEffect(() => {
    setValue("totalHours", totalHours);
  }, [totalHours, setValue]);

  const filteredEmployees = employees.filter((employee) => employee.storeId === storeId);
  const minDate =
    role === "MANAGER" && pastDaysAllowed ? format(subDays(new Date(), pastDaysAllowed), "yyyy-MM-dd") : undefined;
  const maxDate = format(new Date(), "yyyy-MM-dd");

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/attendance", {
      method: attendance ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(attendance ? { ...values, attendanceId: attendance.id } : values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save attendance");
      return;
    }

    toast.success(attendance ? "Attendance updated" : "Attendance saved");
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={attendance ? "outline" : "default"} size={attendance ? "sm" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{attendance ? "Edit attendance" : "Add attendance"}</DialogTitle>
          <DialogDescription>Record daily attendance and calculated work hours.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Store</label>
            <Select value={storeId} onValueChange={(value) => setValue("storeId", value, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Employee</label>
            <Select value={watch("employeeId")} onValueChange={(value) => setValue("employeeId", value, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {filteredEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId ? <p className="text-xs text-destructive">{errors.employeeId.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" min={minDate} max={maxDate} {...register("date")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clock in</label>
              <Input type="time" {...register("clockIn")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Clock out</label>
              <Input type="time" {...register("clockOut")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Total hours</label>
            <Input readOnly value={totalHours.toFixed(2)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : attendance ? "Save changes" : "Create record"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
