"use client";

import React, { useEffect, useState } from 'react';

interface HydrationBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HydrationBoundary({ children, fallback }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // This effect only runs on the client after hydration
    setIsHydrated(true);
  }, []);

  // During SSR and before hydration, show fallback or children
  if (!isHydrated) {
    return fallback ? <>{fallback}</> : <>{children}</>;
  }

  // After hydration, show children
  return <>{children}</>;
}

// Hook to check if component is hydrated
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
