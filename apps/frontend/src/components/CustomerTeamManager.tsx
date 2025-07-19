"use client";

import React, { useState, useEffect } from "react";
import { teamsApi, entityUsersApi } from "@/lib/api/teams";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  teamId?: string;
  entityId: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  user?: {
    id: string;
    username: string;
    hashedPassword?: string;
  };
}

interface Team {
  id: string;
  name: string;
  description?: string;
  entityId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    teamId: "",
    username: "",
    password: "",
  });

  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, customersData] = await Promise.all([
          teamsApi.getByEntity(entityId),
          entityUsersApi.getByEntity(entityId),
        ]);

        setTeams(
          teamsData.map((team) => ({
            ...team,
            memberCount: team.memberCount || 0,
          })),
        );

        // Map entity users to customers format
        const mappedCustomers: Customer[] = customersData.map((entityUser) => ({
          id: entityUser.id,
          firstName: entityUser.user?.name?.split(" ")[0] || "",
          lastName: entityUser.user?.name?.split(" ")[1] || "",
          email: entityUser.user?.email || "",
          phone: "",
          teamId: undefined, // Will need to be set based on team assignments
          entityId: entityId,
          status: (entityUser.status === "ACTIVE" ? "ACTIVE" : "INACTIVE") as
            | "ACTIVE"
            | "INACTIVE",
          createdAt: entityUser.createdAt,
          user: {
            id: entityUser.userId,
            username: entityUser.user?.name || "",
          },
        }));

        setCustomers(mappedCustomers);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [entityId]);

  // Function to check username uniqueness
  const checkUsernameUnique = async (username: string) => {
    if (!username.trim()) {
      setUsernameError(null);
      return;
    }

    setCheckingUsername(true);
    setUsernameError(null);

    try {
      // Check if username exists in current customers
      const existingCustomer = customers.find(
        (customer) =>
          customer.user?.username.toLowerCase() === username.toLowerCase(),
      );

      if (existingCustomer) {
        setUsernameError("Username already exists for this entity");
        return;
      }

      // Note: In a real implementation, you would also check against the backend
      // for system-wide username uniqueness with an API call like:
      // const response = await usersApi.checkUsername(username);
      // if (response.exists) {
      //   setUsernameError('Username already exists');
      // }
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Unable to validate username. Please try again.");
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if there's a username error
    if (usernameError) {
      alert("Please resolve username validation errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      // Create the customer with user account
      const customerData = {
        firstName: customerForm.firstName,
        lastName: customerForm.lastName,
        email: customerForm.email,
        phone: customerForm.phone,
        entityId: entityId,
        status: "ACTIVE" as const,
        user: {
          username: customerForm.username,
          password: customerForm.password,
          email: customerForm.email,
        },
      };

      // For now, we'll use the create method from the API
      const createData = {
        entityId: entityId,
        userId: "temp-user-id", // This would need to be created first
        role: "USER",
        creditLimit: 0,
        seatAllocation: 1,
      };
      const newCustomer = await entityUsersApi.create(createData);

      // Assign to team if selected
      if (customerForm.teamId) {
        await entityUsersApi.assignToTeam(newCustomer.id, customerForm.teamId);
      }

      // Add to customers list
      const mappedCustomer: Customer = {
        id: newCustomer.id,
        firstName: customerForm.firstName,
        lastName: customerForm.lastName,
        email: customerForm.email,
        phone: customerForm.phone,
        teamId: customerForm.teamId || undefined,
        entityId: entityId,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        user: {
          id: newCustomer.id,
          username: customerForm.username,
        },
      };

      setCustomers((prev) => [...prev, mappedCustomer]);

      // Reset form
      setCustomerForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        teamId: "",
        username: "",
        password: "",
      });
      setShowAddCustomerForm(false);
    } catch (error) {
      console.error("Failed to add customer:", error);
      alert("Failed to add customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const teamData = {
        name: teamForm.name,
        description: teamForm.description,
        entityId: entityId,
      };

      const newTeam = await teamsApi.create(teamData);

      // Add to teams list
      const mappedTeam: Team = {
        ...newTeam,
        memberCount: 0,
      };

      setTeams((prev) => [...prev, mappedTeam]);

      // Reset form
      setTeamForm({ name: "", description: "" });
      setShowAddTeamForm(false);
    } catch (error) {
      console.error("Failed to add team:", error);
      alert("Failed to add team. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4 w-1/3"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

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
                      htmlFor="customer-firstName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      First Name *
                    </label>
                    <input
                      id="customer-firstName"
                      type="text"
                      value={customerForm.firstName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      required
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="customer-lastName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Last Name *
                    </label>
                    <input
                      id="customer-lastName"
                      type="text"
                      value={customerForm.lastName}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      required
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  <div>
                    <label
                      htmlFor="customer-phone"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Phone
                    </label>
                    <input
                      id="customer-phone"
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="customer-username"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Username *
                    </label>
                    <input
                      id="customer-username"
                      type="text"
                      value={customerForm.username}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      onBlur={(e) => checkUsernameUnique(e.target.value)}
                      required
                      className={`mt-1 block w-full px-2 py-1 text-sm border rounded-md focus:outline-none ${
                        usernameError
                          ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {checkingUsername && (
                      <p className="mt-1 text-xs text-blue-600">
                        Checking username availability...
                      </p>
                    )}
                    {usernameError && (
                      <p className="mt-1 text-xs text-red-600">
                        {usernameError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="customer-password"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Password *
                    </label>
                    <input
                      id="customer-password"
                      type="password"
                      value={customerForm.password}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      minLength={6}
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
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                    {customer.user && (
                      <p className="text-xs text-blue-600">
                        Username: {customer.user.username}
                      </p>
                    )}
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
