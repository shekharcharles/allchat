import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientSessionProvider from "@/components/auth/client-session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AllChat",
  description: "Experience intelligent conversations with cutting-edge AI.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className} suppressHydrationWarning>
        <ClientSessionProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen bg-background text-foreground" suppressHydrationWarning>
              <main className="flex-grow">{children}</main>
            </div>
          </ThemeProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}
