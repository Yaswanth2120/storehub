import { redirect } from "next/navigation";
import { SetNewPasswordForm } from "@/frontend/components/forms/set-new-password-form";

export default function OwnerResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    redirect("/forgot-password");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <SetNewPasswordForm token={token} />
    </div>
  );
}
