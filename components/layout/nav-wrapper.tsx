"use client";

import { useEffect, useState } from "react";
import MainNav from "./main-nav";

export default function NavWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-foreground">MyApp</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return <MainNav />;
} 