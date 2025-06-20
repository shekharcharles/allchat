"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function MainNav() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-foreground">
              MyApp
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {status === "loading" ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : session ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  {session.user?.email || session.user?.name || "User"}
                </Button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium text-foreground hover:text-primary"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
