"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <Toaster richColors position="top-right" />
    </SessionProvider>
  );
}
