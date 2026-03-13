"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users2 } from "lucide-react";
import { toast } from "sonner";
import { AddEmployeeModal } from "@/frontend/components/modals/add-employee-modal";
import { ChangePayRateModal } from "@/frontend/components/modals/change-pay-rate-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";
import { cn } from "@/lib/utils";

type EmployeesClientProps = {
  role: string;
  stores: Array<{ id: string; name: string }>;
  employees: Array<{
    id: string;
    name: string;
    kind: "EMPLOYEE" | "USER";
    status: string;
    payRate: number;
    storeIds: string[];
    storeNames: string[];
    roleLabel: string;
    latestPayHistory: {
      oldPayRate: number | null;
      newPayRate: number;
      effectiveDate: string | Date;
    } | null;
  }>;
};

export function EmployeesClient({ role, stores, employees }: EmployeesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const showPayRate = role !== "MANAGER";

  const filtered = useMemo(
    () =>
      employees.filter((employee) => {
        const matchesSearch = employee.name.toLowerCase().includes(search.toLowerCase());
        const matchesStore = storeFilter === "all" || employee.storeIds.includes(storeFilter);
        return matchesSearch && matchesStore;
      }),
    [employees, search, storeFilter],
  );

  async function deleteEmployee(employeeId: string) {
    const response = await fetch(`/api/employees?employeeId=${employeeId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Unable to delete employee");
      return;
    }

    toast.success("Employee deleted");
    router.refresh();
  }

  return (
    <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
      <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">Employees</CardTitle>
          <p className="max-w-xl text-[15px] leading-6 text-[#6e6e73]">
            {showPayRate
              ? "Review employees and shift-covering managers with a cleaner directory of status, assigned locations, and pay."
              : "Review employees and shift-covering managers with a cleaner directory of status and assigned locations."}
          </p>
        </div>

        <div className="grid w-full gap-3 lg:grid-cols-[240px_190px_auto] xl:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e93]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee"
              className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] pl-11 shadow-none"
            />
          </div>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] shadow-none">
              <SelectValue placeholder="Filter by store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {role !== "MANAGER" ? <AddEmployeeModal triggerLabel="Add Employee" stores={stores} /> : null}
        </div>
      </CardHeader>

      <CardContent className="p-7 pt-0">
        <div className="overflow-x-auto rounded-[24px] border border-[#e5e5ea] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#ececf1] bg-[#fbfbfd] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Store</th>
                <th className="px-6 py-4">Status</th>
                {showPayRate ? <th className="px-6 py-4">Pay Rate</th> : null}
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={cn(
                    "border-b border-[#f1f1f4] text-[15px] text-[#3a3a3c] transition-colors hover:bg-[#fafafd]",
                    index === filtered.length - 1 && "border-b-0",
                  )}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#0071e3]">
                        <Users2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1d1d1f]">{employee.name}</p>
                        <p className="text-sm text-[#8e8e93]">{employee.kind === "USER" ? "Management staff" : "Employee record"}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <Badge variant={employee.kind === "USER" ? "default" : "outline"}>{employee.roleLabel}</Badge>
                  </td>

                  <td className="px-6 py-5 text-[#6e6e73]">{employee.storeNames.join(", ")}</td>

                  <td className="px-6 py-5">
                    <Badge variant={employee.status === "Active" ? "success" : "warning"}>{employee.status}</Badge>
                  </td>

                  {showPayRate ? (
                    <td className="px-6 py-5 text-[#1d1d1f]">
                      {employee.kind === "EMPLOYEE" || employee.payRate > 0 ? (
                        `$${employee.payRate.toFixed(2)}`
                      ) : (
                        <span className="text-[#8e8e93]">N/A</span>
                      )}
                    </td>
                  ) : null}

                  <td className="px-6 py-5">
                    {role === "MANAGER" ? (
                      <span className="text-sm text-[#8e8e93]">Read only</span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {employee.kind === "EMPLOYEE" ? (
                          <>
                            <AddEmployeeModal
                              triggerLabel="Edit"
                              stores={stores}
                              employee={{
                                id: employee.id,
                                name: employee.name,
                                storeId: employee.storeIds[0] ?? "",
                                status: employee.status,
                                payRate: employee.payRate,
                              }}
                            />
                            <ChangePayRateModal
                              workerId={employee.id}
                              workerType="EMPLOYEE"
                              workerName={employee.name}
                              currentPayRate={employee.payRate}
                              latestPayHistory={employee.latestPayHistory}
                            />
                            <Button variant="destructive" size="sm" onClick={() => deleteEmployee(employee.id)}>
                              Delete
                            </Button>
                          </>
                        ) : employee.payRate > 0 ? (
                          <ChangePayRateModal
                            workerId={employee.id.replace("user-", "")}
                            workerType="MANAGER"
                            workerName={employee.name}
                            currentPayRate={employee.payRate}
                            latestPayHistory={employee.latestPayHistory}
                          />
                        ) : (
                          <span className="text-sm text-[#8e8e93]">Read only</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={showPayRate ? 6 : 5} className="px-6 py-12 text-center text-sm text-[#6e6e73]">
                    No employees matched the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
