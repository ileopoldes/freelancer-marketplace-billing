"use client";

import { useState } from "react";
import { useCustomers } from "@/hooks/api";
import { formatCurrency, formatDate, debounce } from "@/lib/utils";
import type { Customer } from "@/lib/api";

export function CustomerDashboard() {
  const { data: customers = [], isLoading, isError } = useCustomers();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "creditBalance" | "createdAt">(
    "name",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter customers based on search term
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Sort customers
  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "creditBalance":
        comparison = parseFloat(a.creditBalance) - parseFloat(b.creditBalance);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 border-error-200 bg-error-50">
        <p className="text-error-700">
          Failed to load customers. Please try again.
        </p>
      </div>
    );
  }

  const totalCustomers = customers.length;
  const totalCreditBalance = customers.reduce(
    (sum, customer) => sum + parseFloat(customer.creditBalance),
    0,
  );
  const customersWithCredits = customers.filter(
    (customer) => parseFloat(customer.creditBalance) > 0,
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">
            Total Credit Balance
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalCreditBalance)}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">
            Customers with Credits
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {customersWithCredits}
          </p>
        </div>
      </div>

      {/* Customer Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium text-gray-900">Customer List</h3>
            <div className="mt-4 sm:mt-0">
              <input
                type="text"
                placeholder="Search customers..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Name</span>
                    {sortBy === "name" && (
                      <span className="text-primary-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>Email</th>
                <th>
                  <button
                    onClick={() => handleSort("creditBalance")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Credit Balance</span>
                    {sortBy === "creditBalance" && (
                      <span className="text-primary-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th>
                  <button
                    onClick={() => handleSort("createdAt")}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Created</span>
                    {sortBy === "createdAt" && (
                      <span className="text-primary-500">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium text-gray-900">{customer.name}</td>
                  <td className="text-gray-500">{customer.email}</td>
                  <td>
                    <span
                      className={`font-medium ${
                        parseFloat(customer.creditBalance) > 0
                          ? "text-success-600"
                          : parseFloat(customer.creditBalance) < 0
                            ? "text-error-600"
                            : "text-gray-500"
                      }`}
                    >
                      {formatCurrency(customer.creditBalance)}
                    </span>
                  </td>
                  <td className="text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedCustomers.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {searchTerm
              ? "No customers found matching your search."
              : "No customers found."}
          </div>
        )}
      </div>
    </div>
  );
}
