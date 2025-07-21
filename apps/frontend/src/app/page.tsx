"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { CustomerDashboard } from "@/components/CustomerDashboard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { BillingJobControl } from "@/components/BillingJobControl";
import { HealthStatus } from "@/components/HealthStatus";
import { MarketplaceEvents } from "@/components/MarketplaceEvents";
import { Credits } from "@/components/Credits";
import { Subscriptions } from "@/components/Subscriptions";
import { Permissions } from "@/components/Permissions";

export default function HomePage() {
  const auth = useAuth();

  // For freelancers, default to marketplace (which they can access)
  // For others, default to customers
  const getDefaultTab = () => {
    if (auth.user?.role === "freelancer") {
      return "marketplace";
    }
    return "customers";
  };

  const [activeTab, setActiveTab] = useState<
    | "customers"
    | "invoices"
    | "billing"
    | "marketplace"
    | "credits"
    | "subscriptions"
    | "permissions"
  >(getDefaultTab());

  // Define tabs available to freelancers
  const freelancerTabs = ["marketplace", "subscriptions", "invoices"];

  // Check if a tab should be visible based on user role
  const isTabVisible = (tabName: string) => {
    if (auth.user?.role === "freelancer") {
      return freelancerTabs.includes(tabName);
    }
    return true; // All other users can see everything
  };

  // Define quick navigation items based on user role
  const getQuickNavItems = () => {
    const allItems = [
      {
        href: "/organizations",
        title: "Organizations",
        description: "Manage organizations and billing models",
        className:
          "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200",
      },
      {
        href: "/entities",
        title: "Entities",
        description: "View and manage entities",
        className:
          "bg-green-50 hover:bg-green-100 text-green-700 border-green-200",
      },
      {
        href: "/projects",
        title: "Projects",
        description: "Manage projects and assignments",
        className: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200",
      },
    ];

    if (auth.user?.role === "freelancer") {
      // Only show Projects for freelancers
      return allItems.filter((item) => item.href === "/projects");
    }

    return allItems;
  };

  const quickNavItems = getQuickNavItems();

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Health Status */}
      <div className="mb-6">
        <HealthStatus />
      </div>

      {/* Quick Navigation */}
      <div className="mb-6">
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Navigation
          </h2>
          <div
            className={`grid grid-cols-1 ${quickNavItems.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"} gap-4`}
          >
            {quickNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`p-4 rounded-lg border ${item.className}`}
              >
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm opacity-80">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {isTabVisible("customers") && (
            <button
              onClick={() => setActiveTab("customers")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "customers"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Customers
            </button>
          )}
          {isTabVisible("invoices") && (
            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "invoices"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Invoices
            </button>
          )}
          {isTabVisible("billing") && (
            <button
              onClick={() => setActiveTab("billing")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "billing"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Billing Jobs
            </button>
          )}
          {isTabVisible("marketplace") && (
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "marketplace"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Marketplace Events
            </button>
          )}
          {isTabVisible("credits") && (
            <button
              onClick={() => setActiveTab("credits")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "credits"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Credits
            </button>
          )}
          {isTabVisible("subscriptions") && (
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscriptions"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Subscriptions
            </button>
          )}
          {isTabVisible("permissions") && (
            <button
              onClick={() => setActiveTab("permissions")}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "permissions"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Permissions
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === "customers" && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Customer Dashboard
            </h2>
            <CustomerDashboard />
          </div>
        )}

        {activeTab === "invoices" && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Invoice Management
            </h2>
            <InvoiceTable />
          </div>
        )}

        {activeTab === "billing" && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Billing Operations
            </h2>
            <BillingJobControl />
          </div>
        )}

        {activeTab === "marketplace" && (
          <div>
            <MarketplaceEvents />
          </div>
        )}

        {activeTab === "credits" && (
          <div>
            <Credits />
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div>
            <Subscriptions />
          </div>
        )}

        {activeTab === "permissions" && (
          <div>
            <Permissions />
          </div>
        )}
      </div>
    </div>
  );
}
