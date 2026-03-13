import { LoginForm } from "@/frontend/components/forms/login-form";

function getDemoCredentials() {
  const raw = process.env.STAGING_DEMO_CREDENTIALS?.trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separatorIndex = entry.indexOf(":");

      if (separatorIndex === -1) {
        return null;
      }

      return {
        username: entry.slice(0, separatorIndex).trim(),
        password: entry.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((entry): entry is { username: string; password: string } => Boolean(entry?.username && entry?.password));
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <LoginForm demoCredentials={getDemoCredentials()} />
    </div>
  );
}
