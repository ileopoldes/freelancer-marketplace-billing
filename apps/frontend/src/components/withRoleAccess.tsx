"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface WithRoleAccessOptions {
  requiredRoles?: string[];
  allowedFeatures?: string[];
  redirectTo?: string;
}

export function withRoleAccess(
  Component: React.ComponentType<any>,
  options: WithRoleAccessOptions = {},
) {
  const {
    requiredRoles = [],
    allowedFeatures = [],
    redirectTo = "/",
  } = options;

  return function WithRoleAccessWrapper(props: any) {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!auth.isAuthenticated || !auth.user) {
        router.push("/login");
        return;
      }

      // Check if user has required role
      if (requiredRoles.length > 0 && !requiredRoles.includes(auth.user.role)) {
        router.push(redirectTo);
        return;
      }

      // Check if freelancer trying to access restricted feature
      if (auth.user.role === "freelancer" && allowedFeatures.length > 0) {
        // This page has specific features defined, check if current page is allowed
        const currentPath = window.location.pathname;
        const featureName = currentPath.split("/")[1]; // Get first path segment

        if (!allowedFeatures.includes(featureName)) {
          router.push(redirectTo);
          return;
        }
      }
    }, [auth.isAuthenticated, auth.user, router]);

    // Show loading while checking authentication/permissions
    if (!auth.isAuthenticated || !auth.user) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    // Check permissions
    if (requiredRoles.length > 0 && !requiredRoles.includes(auth.user.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-4">
              You don&apos;t have permission to access this page.
            </p>
            <button
              onClick={() => router.push(redirectTo)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    // Additional check for freelancer restrictions
    if (auth.user.role === "freelancer" && allowedFeatures.length > 0) {
      const currentPath = window.location.pathname;
      const featureName = currentPath.split("/")[1];

      if (!allowedFeatures.includes(featureName)) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h1>
              <p className="text-gray-600 mb-4">
                This feature is not available for your account type.
              </p>
              <button
                onClick={() => router.push(redirectTo)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        );
      }
    }

    return <Component {...props} />;
  };
}
