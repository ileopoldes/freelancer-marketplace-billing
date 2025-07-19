"use client";

import React, { useState, useEffect } from "react";

interface CreditBalance {
  id: string;
  entityType: "organization" | "entity" | "customer";
  entityId: string;
  entityName: string;
  balance: number;
  lastUpdated: string;
}

interface AddCreditsForm {
  entityType: "organization" | "entity" | "customer";
  entityId: string;
  amount: number;
  description: string;
}

export function Credits() {
  const [creditBalances, setCreditBalances] = useState<CreditBalance[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingCredits, setAddingCredits] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState<
    "all" | "organization" | "entity" | "customer"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [addForm, setAddForm] = useState<AddCreditsForm>({
    entityType: "organization",
    entityId: "",
    amount: 0,
    description: "",
  });

  useEffect(() => {
    // TODO: Implement actual API calls to fetch credit balances
    setLoading(false);
  }, []);

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCredits(true);

    try {
      // TODO: Implement actual API call to add credits
      console.log("Adding credits:", addForm);

      // Reset form
      setAddForm({
        entityType: "organization",
        entityId: "",
        amount: 0,
        description: "",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add credits:", error);
    } finally {
      setAddingCredits(false);
    }
  };

  const filteredBalances = creditBalances.filter((balance) => {
    const matchesType =
      selectedEntityType === "all" || balance.entityType === selectedEntityType;
    const matchesSearch = balance.entityName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded mb-4 w-1/4"></div>
        <div className="h-32 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Credits Management
          </h2>
          <p className="text-sm text-gray-700">
            Manage credit balances for organizations, entities, and customers.
            Credits can be used for pay-as-you-go billing.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Credits
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="entity-type-filter"
            className="block text-sm font-medium text-gray-700"
          >
            Filter by Type
          </label>
          <select
            id="entity-type-filter"
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value as any)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="organization">Organizations</option>
            <option value="entity">Entities</option>
            <option value="customer">Customers</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700"
          >
            Search
          </label>
          <input
            id="search"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Add Credits Form */}
      {showAddForm && (
        <div className="mt-6 bg-white shadow-md rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add Credits
          </h3>
          <form onSubmit={handleAddCredits} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="entityType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Entity Type *
                </label>
                <select
                  id="entityType"
                  value={addForm.entityType}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      entityType: e.target.value as any,
                      entityId: "",
                    }))
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="organization">Organization</option>
                  <option value="entity">Entity</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Credit Amount *
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={addForm.amount}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="entityId"
                className="block text-sm font-medium text-gray-700"
              >
                Select {addForm.entityType} *
              </label>
              <select
                id="entityId"
                value={addForm.entityId}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, entityId: e.target.value }))
                }
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select {addForm.entityType}...</option>
                {/* TODO: Populate with actual data based on entityType */}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={addForm.description}
                onChange={(e) =>
                  setAddForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Optional description for this credit addition..."
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingCredits}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {addingCredits ? "Adding..." : "Add Credits"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Credits Table */}
      <div className="mt-8">
        {filteredBalances.length === 0 ? (
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedEntityType !== "all"
                ? "No matching credit balances"
                : "No credit balances found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedEntityType !== "all"
                ? "Try adjusting your filters to see credit balances."
                : "Get started by adding credits to organizations, entities, or customers."}
            </p>
            {!searchTerm && selectedEntityType === "all" && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Credits
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBalances.map((balance) => (
                  <tr key={balance.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {balance.entityName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${
                          balance.entityType === "organization"
                            ? "bg-blue-100 text-blue-800"
                            : balance.entityType === "entity"
                              ? "bg-green-100 text-green-800"
                              : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {balance.entityType.charAt(0).toUpperCase() +
                          balance.entityType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`font-medium ${
                          balance.balance > 0
                            ? "text-green-600"
                            : balance.balance < 0
                              ? "text-red-600"
                              : "text-gray-500"
                        }`}
                      >
                        ${balance.balance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(balance.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
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
