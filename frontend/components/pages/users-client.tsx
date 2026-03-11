"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddUserModal } from "@/frontend/components/modals/add-user-modal";
import { ChangePayRateModal } from "@/frontend/components/modals/change-pay-rate-modal";
import { ResetPasswordModal } from "@/frontend/components/modals/reset-password-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";

type UsersClientProps = {
  stores: Array<{ id: string; name: string }>;
  users: Array<{
    id: string;
    username: string;
    role: "CO_OWNER" | "MANAGER";
    pastDaysAllowed: number | null;
    payRate?: number | null;
    payRateHistory?: Array<{
      oldPayRate: number | null;
      newPayRate: number;
      effectiveDate: string | Date;
    }>;
    assignedStores: Array<{ store: { id: string; name: string } }>;
  }>;
};

export function UsersClient({ stores, users }: UsersClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState("CO_OWNER");
  const filtered = useMemo(() => users.filter((user) => user.role === tab), [tab, users]);

  async function deleteUser(userId: string) {
    const response = await fetch(`/api/users?userId=${userId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Unable to delete user");
      return;
    }

    toast.success("User deleted");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <p className="text-sm text-muted-foreground">Create co-owner and manager access with store-level permissions.</p>
        </div>
        {tab === "CO_OWNER" ? (
          <AddUserModal role="CO_OWNER" triggerLabel="Add Co-Owner" stores={stores} />
        ) : (
          <AddUserModal role="MANAGER" triggerLabel="Add Manager" stores={stores} />
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="CO_OWNER">Co-Owners</TabsTrigger>
            <TabsTrigger value="MANAGER">Managers</TabsTrigger>
          </TabsList>
          <TabsContent value={tab}>
            <div className="table-scroll overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Assigned Stores</th>
                    {tab === "MANAGER" ? <th className="px-4 py-3 font-medium">Past Days Allowed</th> : null}
                    {tab === "MANAGER" ? <th className="px-4 py-3 font-medium">Pay Rate</th> : null}
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {user.assignedStores.map((entry) => (
                            <Badge key={entry.store.id}>{entry.store.name}</Badge>
                          ))}
                        </div>
                      </td>
                      {tab === "MANAGER" ? <td className="px-4 py-3">{user.pastDaysAllowed}</td> : null}
                      {tab === "MANAGER" ? <td className="px-4 py-3">${(user.payRate ?? 0).toFixed(2)}</td> : null}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <AddUserModal
                            role={user.role}
                            triggerLabel="Edit"
                            stores={stores}
                            user={{
                              id: user.id,
                              username: user.username,
                              pastDaysAllowed: user.pastDaysAllowed,
                              payRate: user.payRate,
                              storeIds: user.assignedStores.map((entry) => entry.store.id),
                            }}
                          />
                          {user.role === "MANAGER" && (user.payRate ?? 0) > 0 ? (
                            <ChangePayRateModal
                              workerId={user.id}
                              workerType="MANAGER"
                              workerName={user.username}
                              currentPayRate={user.payRate ?? 0}
                              latestPayHistory={user.payRateHistory?.[0] ?? null}
                            />
                          ) : null}
                          <ResetPasswordModal userId={user.id} />
                          <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
