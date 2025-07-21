"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function Navigation() {
  const pathname = usePathname();

  // Always call hooks first (required by React hooks rules)
  const auth = useAuth();

  // Don't show navigation on login page or if user is not authenticated
  if (pathname === "/login" || !auth.isAuthenticated) {
    return null;
  }

  // Define navigation items based on user role
  const getNavItems = () => {
    const allNavItems = [
      { href: "/", label: "Dashboard" },
      { href: "/organizations", label: "Organizations" },
      { href: "/entities", label: "Entities" },
      { href: "/customers", label: "Customers" },
      { href: "/projects", label: "Projects" },
    ];

    // If user is a freelancer, only show Dashboard and Projects
    if (auth.user?.role === "freelancer") {
      return allNavItems.filter(
        (item) => item.href === "/" || item.href === "/projects",
      );
    }

    // For all other users (admin, user), show everything
    return allNavItems;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Freelancer Marketplace Billing
            </Link>
          </div>
          <div className="flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === item.href
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {auth.user && (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {auth.user.email}
                  {auth.user.role === "admin" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                      Admin
                    </span>
                  )}
                  {auth.user.role === "freelancer" && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      Freelancer
                    </span>
                  )}
                </span>
                <button
                  onClick={auth.logout}
                  className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
