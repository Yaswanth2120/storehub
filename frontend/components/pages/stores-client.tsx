"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import { toast } from "sonner";
import { AddStoreModal } from "@/frontend/components/modals/add-store-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { cn } from "@/lib/utils";

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
    () => stores.filter((store) => `${store.name} ${store.address}`.toLowerCase().includes(search.toLowerCase())),
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
    <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
      <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">Stores</CardTitle>
          <p className="max-w-xl text-[15px] leading-6 text-[#6e6e73]">
            Manage locations, assigned managers, and staffing coverage with a clean weekly operations view.
          </p>
        </div>

        <div className="grid w-full gap-3 lg:grid-cols-[260px_auto] xl:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8e93]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stores"
              className="h-12 rounded-2xl border-[#d2d2d7] bg-[#fbfbfd] pl-11 shadow-none"
            />
          </div>

          {role === "OWNER" || role === "CO_OWNER" ? (
            <AddStoreModal triggerLabel="Add Store" managers={managers} />
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-7 pt-0">
        <div className="overflow-x-auto rounded-[24px] border border-[#e5e5ea] bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[#ececf1] bg-[#fbfbfd] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Managers Assigned</th>
                <th className="px-6 py-4">Employees</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((store, index) => (
                <tr
                  key={store.id}
                  className={cn(
                    "border-b border-[#f1f1f4] text-[15px] text-[#3a3a3c] transition-colors hover:bg-[#fafafd]",
                    index === filtered.length - 1 && "border-b-0",
                  )}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#0071e3]">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1d1d1f]">{store.name}</p>
                        <p className="text-sm text-[#8e8e93]">Location profile</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-[#6e6e73]">{store.address}</td>

                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {store.users
                        .filter((entry) => entry.user.role === "MANAGER")
                        .map((entry) => (
                          <Badge key={entry.user.id}>{entry.user.username}</Badge>
                        ))}
                      {!store.users.some((entry) => entry.user.role === "MANAGER") ? (
                        <span className="text-sm text-[#8e8e93]">No manager assigned</span>
                      ) : null}
                    </div>
                  </td>

                  <td className="px-6 py-5 text-[#1d1d1f]">{store.employees.length}</td>

                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-2">
                      {role === "OWNER" ? (
                        <>
                          <AddStoreModal
                            triggerLabel="Edit"
                            managers={managers}
                            store={{
                              id: store.id,
                              name: store.name,
                              address: store.address,
                              managerIds: store.users
                                .filter((entry) => entry.user.role === "MANAGER")
                                .map((entry) => entry.user.id),
                            }}
                          />
                          <Button variant="destructive" size="sm" onClick={() => deleteStore(store.id)}>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-[#8e8e93]">Read only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6e6e73]">
                    No stores matched the current search.
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
