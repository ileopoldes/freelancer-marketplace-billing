"use client";

import { useState, useEffect } from "react";
import { subscriptionsApi, Subscription } from "@/lib/api/subscriptions";

// Mock data fallback if API fails
const mockSubscriptions: Subscription[] = [
  {
    id: "1",
    name: "Basic Plan",
    description: "Perfect for small teams and startups",
    price: 29.99,
    billingPeriod: "MONTHLY",
    features: [
      "Up to 5 users",
      "Basic reporting",
      "Email support",
      "10GB storage",
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Professional Plan",
    description: "Ideal for growing businesses",
    price: 79.99,
    billingPeriod: "MONTHLY",
    features: [
      "Up to 25 users",
      "Advanced reporting",
      "Priority support",
      "100GB storage",
      "API access",
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Enterprise Plan",
    description: "For large organizations with complex needs",
    price: 299.99,
    billingPeriod: "MONTHLY",
    features: [
      "Unlimited users",
      "Custom reporting",
      "24/7 support",
      "Unlimited storage",
      "Advanced API access",
      "Custom integrations",
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Basic Yearly",
    description: "Basic plan with yearly billing (20% off)",
    price: 287.9,
    billingPeriod: "YEARLY",
    features: [
      "Up to 5 users",
      "Basic reporting",
      "Email support",
      "10GB storage",
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "monthly" | "yearly">("all");
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);

  const subscriptionsPerPage = 10;
  const totalPages = Math.ceil(totalSubscriptions / subscriptionsPerPage);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from API first, fallback to mock data if it fails
        try {
          const response = await subscriptionsApi.getAll(
            currentPage,
            subscriptionsPerPage,
          );
          setSubscriptions(response.data);
          setTotalSubscriptions(response.total);
        } catch (apiError) {
          console.warn("API call failed, using mock data:", apiError);
          // Fallback to mock data with pagination simulation
          const startIndex = (currentPage - 1) * subscriptionsPerPage;
          const endIndex = startIndex + subscriptionsPerPage;
          const paginatedMockData = mockSubscriptions.slice(
            startIndex,
            endIndex,
          );

          // Add required fields for compatibility
          const compatibleMockData = paginatedMockData.map((sub) => ({
            ...sub,
            createdAt: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          setSubscriptions(compatibleMockData);
          setTotalSubscriptions(mockSubscriptions.length);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
        setError("Failed to load subscriptions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [currentPage]);

  const filteredSubscriptions = subscriptions.filter((subscription) => {
    if (filter === "all") return subscription.isActive;
    return (
      subscription.isActive &&
      subscription.billingPeriod.toLowerCase() === filter
    );
  });

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
            Subscriptions
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Available subscription plans for your organization. Choose the plan
            that best fits your needs.
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="mt-6">
        <label
          htmlFor="billing-filter"
          className="block text-sm font-medium text-gray-700"
        >
          Filter by Billing Period
        </label>
        <select
          id="billing-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Plans</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="mt-8">
        {filteredSubscriptions.length === 0 ? (
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
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No subscriptions available
            </h3>
            <p className="text-gray-600">
              No subscription plans match your current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="relative bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className="px-6 py-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subscription.name}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscription.billingPeriod === "YEARLY"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {subscription.billingPeriod}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {subscription.description}
                  </p>

                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-900">
                        ${subscription.price}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        /
                        {subscription.billingPeriod === "MONTHLY"
                          ? "month"
                          : "year"}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-6 space-y-3">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="flex-shrink-0 w-4 h-4 text-green-500 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm text-gray-600 ml-2">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                      Select Plan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
