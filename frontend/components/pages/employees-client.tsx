"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddEmployeeModal } from "@/frontend/components/modals/add-employee-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/frontend/components/ui/select";

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
  }>;
};

export function EmployeesClient({ role, stores, employees }: EmployeesClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");

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
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <p className="text-sm text-muted-foreground">Review employee status, store assignment, and pay rates.</p>
        </div>
        <div className="grid w-full gap-3 lg:w-auto lg:grid-cols-[220px_180px_auto]">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" />
          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by store" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {role !== "MANAGER" ? <AddEmployeeModal triggerLabel="Add Employee" stores={stores} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="table-scroll overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Employee Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Assigned Store</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Pay Rate</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((employee) => (
                <tr key={employee.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{employee.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={employee.kind === "USER" ? "default" : "outline"}>{employee.roleLabel}</Badge>
                  </td>
                  <td className="px-4 py-3">{employee.storeNames.join(", ")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={employee.status === "Active" ? "success" : "warning"}>{employee.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {employee.kind === "EMPLOYEE" ? `$${employee.payRate.toFixed(2)}` : <span className="text-muted-foreground">N/A</span>}
                  </td>
                  <td className="px-4 py-3">
                    {role === "MANAGER" || employee.kind === "USER" ? (
                      <span className="text-muted-foreground">Read only</span>
                    ) : (
                      <div className="flex gap-2">
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
                        <Button variant="destructive" size="sm" onClick={() => deleteEmployee(employee.id)}>Delete</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
