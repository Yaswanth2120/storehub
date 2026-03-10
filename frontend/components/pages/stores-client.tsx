"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddStoreModal } from "@/frontend/components/modals/add-store-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";

type StoresClientProps = {
  role: string;
  stores: Array<{
    id: string;
    name: string;
    address: string;
    employees: { id: string }[];
    users: { user: { id: string; username: string; role: string } }[];
  }>;
  managers: Array<{ id: string; username: string }>;
};

export function StoresClient({ role, stores, managers }: StoresClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      stores.filter((store) =>
        `${store.name} ${store.address}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, stores],
  );

  async function deleteStore(storeId: string) {
    const response = await fetch(`/api/stores?storeId=${storeId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Unable to delete store");
      return;
    }

    toast.success("Store deleted");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Stores</CardTitle>
          <p className="text-sm text-muted-foreground">Track locations, managers, and employee coverage.</p>
        </div>
        <div className="flex w-full gap-3 lg:w-auto">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stores" />
          {role === "OWNER" || role === "CO_OWNER" ? <AddStoreModal triggerLabel="Add Store" managers={managers} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="table-scroll overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Store Name</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Managers Assigned</th>
                <th className="px-4 py-3 font-medium">Employees</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((store) => (
                <tr key={store.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{store.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{store.address}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {store.users
                        .filter((entry) => entry.user.role === "MANAGER")
                        .map((entry) => (
                          <Badge key={entry.user.id}>{entry.user.username}</Badge>
                        ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{store.employees.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {role === "OWNER" ? (
                        <>
                          <AddStoreModal
                            triggerLabel="Edit"
                            managers={managers}
                            store={{
                              id: store.id,
                              name: store.name,
                              address: store.address,
                              managerIds: store.users.filter((entry) => entry.user.role === "MANAGER").map((entry) => entry.user.id),
                            }}
                          />
                          <Button variant="destructive" size="sm" onClick={() => deleteStore(store.id)}>Delete</Button>
                        </>
                      ) : (
                        <span className="text-muted-foreground">Read only</span>
                      )}
                    </div>
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
