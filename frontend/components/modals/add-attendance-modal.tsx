"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { attendanceSchema } from "@/backend/validations";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";

type AddAttendanceModalProps = {
  triggerLabel: string;
  stores: Array<{ id: string; name: string }>;
  workers: Array<{
    id: string;
    name: string;
    storeIds: string[];
    workerType: "EMPLOYEE" | "MANAGER";
  }>;
  role: string;
  weekStart: string;
  weekEnd: string;
  allowedWeekStarts: string[];
  attendance?: {
    id: string;
    workerId: string;
    workerType: "EMPLOYEE" | "MANAGER";
    storeId: string;
    weekStart: string;
    totalHours: number;
  };
};

function decimalToTime(decimal: number) {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function AddAttendanceModal({
  triggerLabel,
  stores,
  workers,
  role,
  weekStart,
  weekEnd,
  allowedWeekStarts,
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
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      workerId: attendance?.workerId ?? "",
      workerType: attendance?.workerType ?? "EMPLOYEE",
      storeId: attendance?.storeId ?? stores[0]?.id ?? "",
      weekStart: attendance?.weekStart ?? weekStart,
      totalHours: attendance?.totalHours
        ? decimalToTime(attendance.totalHours)
        : "00:00",
    },
  });

  useEffect(() => {
    reset({
      workerId: attendance?.workerId ?? "",
      workerType: attendance?.workerType ?? "EMPLOYEE",
      storeId: attendance?.storeId ?? stores[0]?.id ?? "",
      weekStart: attendance?.weekStart ?? weekStart,
      totalHours: attendance?.totalHours
        ? decimalToTime(attendance.totalHours)
        : "00:00",
    });
  }, [attendance, reset, stores, weekStart]);

  useEffect(() => {
    setValue("weekStart", attendance?.weekStart ?? weekStart, {
      shouldValidate: true,
    });
  }, [attendance?.weekStart, setValue, weekStart]);

  const storeId = watch("storeId");
  const workerType = watch("workerType");

  const filteredWorkers = workers.filter(
    (worker) =>
      worker.storeIds.includes(storeId) && worker.workerType === workerType
  );

  const isManagerWeekAllowed =
    role !== "MANAGER" || allowedWeekStarts.includes(weekStart);

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);

    const response = await fetch("/api/attendance", {
      method: attendance ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        attendance ? { ...values, attendanceId: attendance.id } : values
      ),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save attendance");
      return;
    }

    toast.success(
      attendance ? "Weekly attendance updated" : "Weekly attendance saved"
    );

    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={attendance ? "outline" : "default"}
          size={attendance ? "sm" : "default"}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="rounded-[28px] border-[#e5e5ea] bg-white">
        <DialogHeader>
          <DialogTitle className="text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
            {attendance
              ? "Update weekly attendance"
              : "Add weekly attendance"}
          </DialogTitle>

          <DialogDescription className="text-[14px] leading-6 text-[#6e6e73]">
            Managers enter the total weekly hours worked for each employee or
            manager within the selected Saturday to Friday period.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="rounded-[24px] border border-[#e5e5ea] bg-[#f8f8fa] px-4 py-3 text-sm text-[#4b4b51]">
            Selected week:{" "}
            <span className="font-medium text-[#1d1d1f]">{weekStart}</span> to{" "}
            <span className="font-medium text-[#1d1d1f]">{weekEnd}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#3a3a3c]">Store</label>

            <Select
              value={storeId}
              onValueChange={(value) =>
                setValue("storeId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>

              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#3a3a3c]">
              Worker type
            </label>

            <Select
              value={workerType}
              onValueChange={(value) =>
                setValue("workerType", value as "EMPLOYEE" | "MANAGER", {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#3a3a3c]">
              {workerType === "MANAGER" ? "Manager" : "Employee"}
            </label>

            <Select
              value={watch("workerId")}
              onValueChange={(value) =>
                setValue("workerId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none">
                <SelectValue
                  placeholder={`Select ${
                    workerType === "MANAGER" ? "manager" : "employee"
                  }`}
                />
              </SelectTrigger>

              <SelectContent>
                {filteredWorkers.map((worker) => (
                  <SelectItem key={worker.id} value={worker.id}>
                    {worker.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.workerId && (
              <p className="text-xs text-destructive">
                {errors.workerId.message as string}
              </p>
            )}
          </div>

          <input type="hidden" {...register("weekStart")} />

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#3a3a3c]">
              Total weekly hours
            </label>

            <Input
              type="text"
              placeholder="HH:MM (example 27:30)"
              className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none"
              {...register("totalHours", {
                setValueAs: (value: string) => {
                  if (!value) return 0;

                  const [hours, minutes] = value.split(":").map(Number);

                  if (isNaN(hours) || isNaN(minutes)) return NaN;

                  return hours + minutes / 60;
                },
              })}
            />

            {errors.totalHours && (
              <p className="text-xs text-destructive">
                {errors.totalHours.message as string}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !isManagerWeekAllowed}
            >
              {loading
                ? "Saving..."
                : attendance
                ? "Save changes"
                : "Save weekly hours"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}