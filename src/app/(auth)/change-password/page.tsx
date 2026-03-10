import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/frontend/components/forms/change-password-form";
import { getSession } from "@/backend/auth";

export default async function ChangePasswordPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <ChangePasswordForm />
    </div>
  );
}
