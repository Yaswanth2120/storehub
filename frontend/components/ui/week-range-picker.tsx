"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/frontend/components/ui/dropdown-menu";
import { cn, formatDate, parseDateOnly } from "@/lib/utils";

type WeekOption = {
  start: string;
  end: string;
  label: string;
};

type WeekRangePickerProps = {
  options: WeekOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

type MonthBucket = {
  key: string;
  year: number;
  month: number;
  monthLabel: string;
  options: WeekOption[];
};

function getMonthKeyFromOption(option?: WeekOption) {
  if (!option) return "";
  const endDate = parseDateOnly(option.end);
  return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
}

export function WeekRangePicker({ options, value, onChange, className }: WeekRangePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.start === value) ?? options[0];

  const buckets = useMemo<MonthBucket[]>(() => {
    const grouped = new Map<string, MonthBucket>();

    for (const option of options) {
      const endDate = parseDateOnly(option.end);
      const key = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          year: endDate.getFullYear(),
          month: endDate.getMonth(),
          monthLabel: formatDate(option.end, "MMMM yyyy"),
          options: [],
        });
      }

      grouped.get(key)!.options.push(option);
    }

    return Array.from(grouped.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [options]);

  const years = useMemo(() => Array.from(new Set(buckets.map((bucket) => bucket.year))).sort((a, b) => b - a), [buckets]);
  const defaultBucketKey = getMonthKeyFromOption(selected) || buckets[0]?.key || "";
  const [selectedBucketKey, setSelectedBucketKey] = useState(defaultBucketKey);

  useEffect(() => {
    const nextKey = getMonthKeyFromOption(selected) || buckets[0]?.key || "";
    setSelectedBucketKey((current) => (buckets.some((bucket) => bucket.key === current) ? current : nextKey));
  }, [buckets, selected]);

  const selectedBucket = buckets.find((bucket) => bucket.key === selectedBucketKey) ?? buckets[0];
  const selectedYear = selectedBucket?.year ?? years[0];
  const monthOptionsForYear = buckets.filter((bucket) => bucket.year === selectedYear);

  function handleYearChange(nextYear: number) {
    const firstMonthForYear = buckets.find((bucket) => bucket.year === nextYear);
    if (firstMonthForYear) {
      setSelectedBucketKey(firstMonthForYear.key);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-2xl border border-[#d2d2d7] bg-[#fbfbfd] px-4 text-left text-sm font-medium text-[#1d1d1f] shadow-none transition-colors hover:bg-white",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <CalendarRange className="h-4 w-4 shrink-0 text-[#8e8e93]" />
            <span className="truncate">{selected?.label ?? "Select week"}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#8e8e93]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[360px] rounded-[24px] border border-[#e5e5ea] bg-white p-3">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Year</span>
              <select
                className="h-11 w-full rounded-2xl border border-[#d2d2d7] bg-[#fbfbfd] px-3 text-sm text-[#1d1d1f] outline-none"
                value={selectedYear}
                onChange={(event) => handleYearChange(Number(event.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">Month</span>
              <select
                className="h-11 w-full rounded-2xl border border-[#d2d2d7] bg-[#fbfbfd] px-3 text-sm text-[#1d1d1f] outline-none"
                value={selectedBucket?.key ?? ""}
                onChange={(event) => setSelectedBucketKey(event.target.value)}
              >
                {monthOptionsForYear.map((bucket) => (
                  <option key={bucket.key} value={bucket.key}>
                    {formatDate(new Date(bucket.year, bucket.month, 1), "MMMM")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
              {selectedBucket?.monthLabel ?? "Available Weeks"}
            </p>

            <div className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
              {selectedBucket?.options.map((option) => {
                const active = option.start === value;

                return (
                  <button
                    key={option.start}
                    type="button"
                    onClick={() => {
                      onChange(option.start);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left text-[15px] text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7]",
                      active && "bg-[#f2f2f7]",
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-[#1d1d1f]">
                      {active ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
