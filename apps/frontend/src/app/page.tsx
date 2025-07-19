"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerDashboard } from "@/components/CustomerDashboard";
import { InvoiceTable } from "@/components/InvoiceTable";
import { BillingJobControl } from "@/components/BillingJobControl";
import { HealthStatus } from "@/components/HealthStatus";
import { MarketplaceEvents } from "@/components/MarketplaceEvents";
import { Credits } from "@/components/Credits";
import { Subscriptions } from "@/components/Subscriptions";
import { Permissions } from "@/components/Permissions";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<
    | "customers"
    | "invoices"
    | "billing"
    | "marketplace"
    | "credits"
    | "subscriptions"
    | "permissions"
  >("customers");

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/organizations"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-4 rounded-lg border border-indigo-200"
            >
              <h3 className="font-medium">Organizations</h3>
              <p className="text-sm text-indigo-600">
                Manage organizations and billing models
              </p>
            </Link>
            <Link
              href="/entities"
              className="bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg border border-green-200"
            >
              <h3 className="font-medium">Entities</h3>
              <p className="text-sm text-green-600">View and manage entities</p>
            </Link>
            <Link
              href="/projects"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg border border-blue-200"
            >
              <h3 className="font-medium">Projects</h3>
              <p className="text-sm text-blue-600">
                Manage projects and assignments
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
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
