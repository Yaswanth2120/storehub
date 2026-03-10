"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Textarea } from "@/frontend/components/ui/textarea";
import { settingsSchema } from "@/backend/validations";

type SettingsValues = z.infer<typeof settingsSchema>;

type SettingsClientProps = {
  readOnly: boolean;
  settings: SettingsValues;
};

export function SettingsClient({ readOnly, settings }: SettingsClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const onSubmit = handleSubmit(async (values) => {
    setLoading(true);
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "Unable to save settings");
      return;
    }

    toast.success("Settings updated");
    router.refresh();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <p className="text-sm text-muted-foreground">
          {readOnly ? "Co-Owners can review settings but cannot edit them." : "Configure system-wide company settings."}
        </p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company name</label>
            <Input disabled={readOnly} {...register("companyName")} />
            {errors.companyName ? <p className="text-xs text-destructive">{errors.companyName.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recovery email</label>
              <Input disabled={readOnly} {...register("recoveryEmail")} />
              {errors.recoveryEmail ? <p className="text-xs text-destructive">{errors.recoveryEmail.message}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Timezone</label>
              <Input disabled={readOnly} {...register("timezone")} />
              {errors.timezone ? <p className="text-xs text-destructive">{errors.timezone.message}</p> : null}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea disabled={readOnly} {...register("notes")} />
          </div>
          <Button disabled={readOnly || loading} type="submit">
            {loading ? "Saving..." : "Save settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
