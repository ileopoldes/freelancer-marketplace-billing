"use client";

import React, { useState } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  teamId?: string;
  entityId: string;
  status: string;
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  entityId: string;
  memberCount: number;
  status: string;
  createdAt: string;
}

interface CustomerTeamManagerProps {
  entityId: string;
  entityName: string;
}

export function CustomerTeamManager({
  entityId,
  entityName,
}: CustomerTeamManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<"customers" | "teams">(
    "customers",
  );
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [showAddTeamForm, setShowAddTeamForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    email: "",
    teamId: "",
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual API call
      console.log("Adding customer:", { ...customerForm, entityId });

      // Reset form
      setCustomerForm({ name: "", email: "", teamId: "" });
      setShowAddCustomerForm(false);
    } catch (error) {
      console.error("Failed to add customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Implement actual API call
      console.log("Adding team:", { ...teamForm, entityId });

      // Reset form
      setTeamForm({ name: "", description: "" });
      setShowAddTeamForm(false);
    } catch (error) {
      console.error("Failed to add team:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="border-b border-gray-200 mb-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Customers & Teams for {entityName}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage customers and teams within this entity
            </p>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex space-x-8 mt-4" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("customers")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "customers"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "teams"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Teams ({teams.length})
          </button>
        </nav>
      </div>

      {/* Customers Tab */}
      {activeTab === "customers" && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">Customers</h4>
              <p className="text-sm text-gray-500">
                Manage customers within this entity and assign them to teams
              </p>
            </div>
            <button
              onClick={() => setShowAddCustomerForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Customer
            </button>
          </div>

          {/* Add Customer Form */}
          {showAddCustomerForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">
                Add New Customer
              </h5>
              <form onSubmit={handleAddCustomer} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Name *
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer-email"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Email *
                    </label>
                    <input
                      id="customer-email"
                      type="email"
                      value={customerForm.email}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="customer-team"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Team (Optional)
                  </label>
                  <select
                    id="customer-team"
                    value={customerForm.teamId}
                    onChange={(e) =>
                      setCustomerForm((prev) => ({
                        ...prev,
                        teamId: e.target.value,
                      }))
                    }
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">No team assigned</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerForm(false)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Customer"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customers List */}
          {customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No customers found for this entity.</p>
              <p className="text-xs mt-1">
                Add your first customer to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                    {customer.teamId && (
                      <p className="text-xs text-indigo-600">
                        Team:{" "}
                        {teams.find((t) => t.id === customer.teamId)?.name ||
                          "Unknown"}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-xs text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button className="text-xs text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === "teams" && (
        <div>
          <div className="sm:flex sm:items-center sm:justify-between mb-4">
            <div>
              <h4 className="text-md font-medium text-gray-900">Teams</h4>
              <p className="text-sm text-gray-500">
                Create and manage teams to organize customers
              </p>
            </div>
            <button
              onClick={() => setShowAddTeamForm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Team
            </button>
          </div>

          {/* Add Team Form */}
          {showAddTeamForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">
                Add New Team
              </h5>
              <form onSubmit={handleAddTeam} className="space-y-3">
                <div>
                  <label
                    htmlFor="team-name"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Name *
                  </label>
                  <input
                    id="team-name"
                    type="text"
                    value={teamForm.name}
                    onChange={(e) =>
                      setTeamForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="team-description"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="team-description"
                    value={teamForm.description}
                    onChange={(e) =>
                      setTeamForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTeamForm(false)}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Team"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teams List */}
          {teams.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No teams found for this entity.</p>
              <p className="text-xs mt-1">
                Create your first team to organize customers.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {team.name}
                    </p>
                    {team.description && (
                      <p className="text-xs text-gray-500">
                        {team.description}
                      </p>
                    )}
                    <p className="text-xs text-indigo-600">
                      {team.memberCount} members
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-xs text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                    <button className="text-xs text-red-600 hover:text-red-900">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
