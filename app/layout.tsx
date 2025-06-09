import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PlausibleProvider from "next-plausible";
import ClientSessionProvider from "@/components/auth/client-session-provider";
import MainNav from "@/components/layout/main-nav";
import { ThemeProvider } from "@/components/theme-provider"; // Import ThemeProvider
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "T3 Chat Cloneathon",
  description:
    "Build an open source clone of T3 Chat and compete for over $10,000 in prizes.",
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
    <ClientSessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <PlausibleProvider domain="cloneathon.t3.gg">
          <html lang="en" suppressHydrationWarning> {/* Remove className="dark", add suppressHydrationWarning */}
            <body className={`${inter.className} flex flex-col min-h-screen bg-background text-foreground`}> {/* Added bg-background and text-foreground for default theme application */}
              <MainNav />
              <main className="flex-grow">
                {children}
              </main>
            </body>
          </html>
        </PlausibleProvider>
      </ThemeProvider>
    </ClientSessionProvider>
  );
}
