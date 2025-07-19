"use client";

import { useState, useEffect } from "react";

interface MarketplaceEvent {
  id: string;
  name: string;
  description: string;
  eventType:
    | "PURCHASE"
    | "SUBSCRIPTION_CHANGE"
    | "USAGE_REPORT"
    | "BILLING_UPDATE"
    | "REFUND";
  source: string;
  timestamp: string;
  entityId: string;
  entityName: string;
  amount?: number;
  currency?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  metadata?: Record<string, any>;
}

// Mock data for now - will be replaced with API calls
const mockEvents: MarketplaceEvent[] = [
  {
    id: "1",
    name: "Subscription Purchase",
    description: "Professional plan subscription activated",
    eventType: "PURCHASE",
    source: "Stripe",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    entityId: "ent-1",
    entityName: "Acme Corp - Development",
    amount: 79.99,
    currency: "USD",
    status: "COMPLETED",
    metadata: { planId: "prof-monthly", seats: 10 },
  },
  {
    id: "2",
    name: "Usage Report",
    description: "Monthly API usage report processed",
    eventType: "USAGE_REPORT",
    source: "Internal",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    entityId: "ent-2",
    entityName: "TechStart - Marketing",
    status: "COMPLETED",
    metadata: { apiCalls: 15420, period: "2024-01" },
  },
  {
    id: "3",
    name: "Subscription Upgrade",
    description: "Upgraded from Basic to Professional plan",
    eventType: "SUBSCRIPTION_CHANGE",
    source: "PayPal",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    entityId: "ent-3",
    entityName: "Innovation Labs - Research",
    amount: 50.0,
    currency: "USD",
    status: "COMPLETED",
    metadata: { fromPlan: "basic-monthly", toPlan: "prof-monthly" },
  },
  {
    id: "4",
    name: "Billing Update",
    description: "Payment method updated successfully",
    eventType: "BILLING_UPDATE",
    source: "Stripe",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    entityId: "ent-1",
    entityName: "Acme Corp - Development",
    status: "COMPLETED",
    metadata: { paymentMethod: "card_ending_4242" },
  },
  {
    id: "5",
    name: "Refund Processed",
    description: "Partial refund for unused subscription",
    eventType: "REFUND",
    source: "Stripe",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
    entityId: "ent-4",
    entityName: "Global Tech - Sales",
    amount: -25.99,
    currency: "USD",
    status: "COMPLETED",
    metadata: { reason: "subscription_cancellation", originalAmount: 79.99 },
  },
  {
    id: "6",
    name: "Failed Payment",
    description: "Monthly subscription payment failed",
    eventType: "PURCHASE",
    source: "Stripe",
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
    entityId: "ent-5",
    entityName: "StartupXYZ - Operations",
    amount: 29.99,
    currency: "USD",
    status: "FAILED",
    metadata: { errorCode: "card_declined", retryCount: 3 },
  },
];

export default function MarketplaceEventsPage() {
  const [events, setEvents] = useState<MarketplaceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | MarketplaceEvent["eventType"]>(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | MarketplaceEvent["status"]
  >("all");

  useEffect(() => {
    // Simulate API call
    const fetchEvents = async () => {
      try {
        // TODO: Replace with actual API call
        // const data = await marketplaceEventsApi.getAll();
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
        setEvents(mockEvents);
      } catch (error) {
        console.error("Failed to fetch marketplace events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const typeMatch = filter === "all" || event.eventType === filter;
    const statusMatch = statusFilter === "all" || event.status === statusFilter;
    return typeMatch && statusMatch;
  });

  const getEventTypeColor = (type: MarketplaceEvent["eventType"]) => {
    switch (type) {
      case "PURCHASE":
        return "bg-green-100 text-green-800";
      case "SUBSCRIPTION_CHANGE":
        return "bg-blue-100 text-blue-800";
      case "USAGE_REPORT":
        return "bg-purple-100 text-purple-800";
      case "BILLING_UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "REFUND":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: MarketplaceEvent["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4 w-1/4"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            Marketplace Events
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all marketplace events including purchases, subscriptions,
            usage reports, and billing updates.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="event-type-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Event Type
          </label>
          <select
            id="event-type-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Event Types</option>
            <option value="PURCHASE">Purchases</option>
            <option value="SUBSCRIPTION_CHANGE">Subscription Changes</option>
            <option value="USAGE_REPORT">Usage Reports</option>
            <option value="BILLING_UPDATE">Billing Updates</option>
            <option value="REFUND">Refunds</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="mt-8">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
              <svg
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600">
              No marketplace events match your current filters.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.entityName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}
                      >
                        {event.eventType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(event.amount, event.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${getStatusColor(event.status)}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
