import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/frontend/providers/app-providers";

export const metadata: Metadata = {
  title: "StoreHub",
  description: "Store operations dashboard for stores, employees, attendance, payroll, and user access.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
