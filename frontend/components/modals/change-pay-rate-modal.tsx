"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { payRateChangeSchema } from "@/backend/validations";
import { Button } from "@/frontend/components/ui/button";
import { Checkbox } from "@/frontend/components/ui/checkbox";
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
import { formatDate } from "@/lib/utils";

type ChangePayRateModalProps = {
  triggerLabel?: string;
  workerId: string;
  workerType: "EMPLOYEE" | "MANAGER";
  workerName: string;
  currentPayRate: number;
  latestPayHistory: {
    oldPayRate: number | null;
    newPayRate: number;
    effectiveDate: string | Date;
  } | null;
};

const APPLY_OPTIONS = [
  { value: "FUTURE_ONLY", label: "Future dates only" },
  { value: "DATE_RANGE", label: "Selected date range" },
  { value: "ONE_DAY", label: "One specific day" },
  { value: "ALL_RECORDS", label: "All previous and future records" },
] as const;

export function ChangePayRateModal({
  triggerLabel = "Change Pay Rate",
  workerId,
  workerType,
  workerName,
  currentPayRate,
  latestPayHistory,
}: ChangePayRateModalProps) {
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
    resolver: zodResolver(payRateChangeSchema),
    defaultValues: {
      workerId,
      workerType,
      currentPayRate,
      newPayRate: currentPayRate,
      applyMode: "FUTURE_ONLY",
      effectiveStartDate: "",
      startDate: "",
      endDate: "",
      date: "",
      confirmAllRecords: false,
    },
  });

  const applyMode = watch("applyMode");
  const warningText = useMemo(
    () => `This will overwrite the saved pay rate on all existing attendance records for ${workerName} and update the current rate going forward.`,
    [workerName],
  );
  const latestHistoryMessage =
    latestPayHistory?.oldPayRate != null
      ? `Pay changed from $${latestPayHistory.oldPayRate.toFixed(2)} to $${latestPayHistory.newPayRate.toFixed(2)} effective ${formatDate(latestPayHistory.effectiveDate)}.`
      : null;

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/pay-rate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to change pay rate");
      return;
    }

    toast.success("Pay rate updated");
    setOpen(false);
    router.refresh();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Pay Rate</DialogTitle>
          <DialogDescription>Apply a pay rate change for this employee or manager.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input type="hidden" {...register("workerId")} />
          <input type="hidden" {...register("workerType")} />
          <input type="hidden" {...register("currentPayRate")} />

          <div className="space-y-2">
            <label className="text-sm font-medium">Employee Name</label>
            <Input value={workerName} readOnly />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Pay Rate</label>
            <Input value={currentPayRate.toFixed(2)} readOnly />
          </div>
          {latestHistoryMessage ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {latestHistoryMessage}
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Pay Rate</label>
            <Input type="number" step="0.01" min={1} {...register("newPayRate")} />
            {errors.newPayRate ? <p className="text-xs text-destructive">{errors.newPayRate.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Apply this pay change to</label>
            <Select value={applyMode} onValueChange={(value) => setValue("applyMode", value as "FUTURE_ONLY" | "DATE_RANGE" | "ONE_DAY" | "ALL_RECORDS", { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
              <SelectContent>
                {APPLY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {applyMode === "FUTURE_ONLY" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Effective Start Date</label>
              <Input type="date" {...register("effectiveStartDate")} />
              {errors.effectiveStartDate ? <p className="text-xs text-destructive">{errors.effectiveStartDate.message}</p> : null}
            </div>
          ) : null}

          {applyMode === "DATE_RANGE" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate ? <p className="text-xs text-destructive">{errors.startDate.message}</p> : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" {...register("endDate")} />
                {errors.endDate ? <p className="text-xs text-destructive">{errors.endDate.message}</p> : null}
              </div>
            </div>
          ) : null}

          {applyMode === "ONE_DAY" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" {...register("date")} />
              {errors.date ? <p className="text-xs text-destructive">{errors.date.message}</p> : null}
            </div>
          ) : null}

          {applyMode === "ALL_RECORDS" ? (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">{warningText}</p>
              <label className="flex items-center gap-2 text-sm text-amber-900">
                <Checkbox
                  checked={watch("confirmAllRecords") ?? false}
                  onCheckedChange={(checked) => setValue("confirmAllRecords", Boolean(checked), { shouldValidate: true })}
                />
                I understand this will update all previous and future records.
              </label>
              {errors.confirmAllRecords ? <p className="text-xs text-destructive">{errors.confirmAllRecords.message}</p> : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
