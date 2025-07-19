"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isAuthenticated, getUserInfo, logout } from "@/lib/auth";

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; role: string } | null>(
    null,
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      // Don't check auth on login page - just set loading to false
      if (pathname === "/login") {
        setIsLoading(false);
        return;
      }

      const authenticated = isAuthenticated();
      const userInfo = getUserInfo();

      if (!authenticated || !userInfo) {
        // Not authenticated, redirect to login
        router.push("/login");
        setIsLoading(false);
        return;
      }

      setUser(userInfo);
      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  const contextValue = {
    user,
    logout,
    isAuthenticated: !!user,
  };

  // Show loading spinner only for protected pages while checking authentication
  // Always show login page immediately
  if (isLoading && pathname !== "/login") {
    return (
      <AuthContext.Provider value={contextValue}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AuthContext.Provider>
    );
  }

  // Always provide context, even on login page
  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Create a context for auth information
const AuthContext = React.createContext<{
  user: { email: string; role: string } | null;
  logout: () => void;
  isAuthenticated: boolean;
} | null>(null);

// Hook to use auth context
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
