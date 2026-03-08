"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ComponentType } from "react";

export default function withAuth<P extends object>(
  Component: ComponentType<P>,
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const hasSession = document.cookie.includes("session=");

      if (!hasSession) {
        router.push("/auth/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    }, [router]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}
