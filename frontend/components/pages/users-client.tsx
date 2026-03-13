"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AddUserModal } from "@/frontend/components/modals/add-user-modal";
import { ChangePayRateModal } from "@/frontend/components/modals/change-pay-rate-modal";
import { ResetPasswordModal } from "@/frontend/components/modals/reset-password-modal";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { cn } from "@/lib/utils";

type UsersClientProps = {
  role: "OWNER" | "CO_OWNER";
  stores: Array<{ id: string; name: string }>;
  users: Array<{
    id: string;
    username: string;
    role: "CO_OWNER" | "MANAGER";
    payRate?: number | null;
    payRateHistory?: Array<{
      oldPayRate: number | null;
      newPayRate: number;
      effectiveDate: string | Date;
    }>;
    assignedStores: Array<{ store: { id: string; name: string } }>;
  }>;
};

export function UsersClient({ role, stores, users }: UsersClientProps) {
  const router = useRouter();
  const defaultTab = role === "OWNER" ? "CO_OWNER" : "MANAGER";
  const [tab, setTab] = useState(defaultTab);

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
    <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-card backdrop-blur">
      <CardHeader className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-2">
          <CardTitle className="text-[2rem] font-semibold tracking-[-0.03em] text-[#1d1d1f]">
            User Management
          </CardTitle>
          <p className="max-w-xl text-[15px] leading-6 text-[#6e6e73]">
            Control co-owner and manager accounts, store permissions, temporary password resets, and management pay.
          </p>
        </div>

        {role === "OWNER" && tab === "CO_OWNER" ? (
          <AddUserModal role="CO_OWNER" triggerLabel="Add Co-Owner" stores={stores} />
        ) : (role === "OWNER" && tab === "MANAGER") || role === "CO_OWNER" ? (
          <AddUserModal role="MANAGER" triggerLabel="Add Manager" stores={stores} />
        ) : null}
      </CardHeader>

      <CardContent className="p-7 pt-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {role === "OWNER" ? <TabsTrigger value="CO_OWNER">Co-Owners</TabsTrigger> : null}
            <TabsTrigger value="MANAGER">Managers</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <div className="overflow-x-auto rounded-[24px] border border-[#e5e5ea] bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ececf1] bg-[#fbfbfd] text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8e8e93]">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Assigned Stores</th>
                    {tab === "MANAGER" ? <th className="px-6 py-4">Pay Rate</th> : null}
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((user, index) => (
                    <tr
                      key={user.id}
                      className={cn(
                        "border-b border-[#f1f1f4] text-[15px] text-[#3a3a3c] transition-colors hover:bg-[#fafafd]",
                        index === filtered.length - 1 && "border-b-0",
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#eef4ff] text-[#0071e3]">
                            <ShieldCheck className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[#1d1d1f]">{user.username}</p>
                            <p className="text-sm text-[#8e8e93]">{user.role === "MANAGER" ? "Manager account" : "Co-owner account"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {user.assignedStores.map((entry) => (
                            <Badge key={entry.store.id}>{entry.store.name}</Badge>
                          ))}
                          {!user.assignedStores.length ? (
                            <span className="text-sm text-[#8e8e93]">No stores assigned</span>
                          ) : null}
                        </div>
                      </td>

                      {tab === "MANAGER" ? (
                        <td className="px-6 py-5 text-[#1d1d1f]">${(user.payRate ?? 0).toFixed(2)}</td>
                      ) : null}

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <AddUserModal
                            role={user.role}
                            triggerLabel="Edit"
                            stores={stores}
                            user={{
                              id: user.id,
                              username: user.username,
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

                          <Button variant="destructive" size="sm" onClick={() => deleteUser(user.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!filtered.length ? (
                    <tr>
                      <td colSpan={tab === "MANAGER" ? 4 : 3} className="px-6 py-12 text-center text-sm text-[#6e6e73]">
                        No users exist in this access group yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
