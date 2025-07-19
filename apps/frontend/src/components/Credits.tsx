"use client";

import React, { useState, useEffect } from "react";
import {
  creditsApi,
  CreditBalance,
  AddCreditsRequest,
} from "@/lib/api/credits";
import { organizationsApi } from "@/lib/api/organizations";
import { entitiesApi } from "@/lib/api/entities";
import { teamsApi } from "@/lib/api/teams";

interface CreditBalanceWithMeta extends CreditBalance {
  entityType: "organization" | "entity" | "customer" | "team";
  entityName: string;
  balance: number;
}

interface AddCreditsForm {
  entityType: "organization" | "entity" | "team";
  entityId: string;
  amount: number;
  description: string;
  selectedOrganizationId?: string;
  selectedEntityId?: string;
}

interface EntityOption {
  id: string;
  name: string;
}

export function Credits() {
  const [creditBalances, setCreditBalances] = useState<CreditBalanceWithMeta[]>(
    [],
  );
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
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<
    EntityOption[]
  >([]);
  const [teamsOptions, setTeamsOptions] = useState<EntityOption[]>([]);

  useEffect(() => {
    const fetchCreditBalances = async () => {
      try {
        const balances = await creditsApi.getAllBalances();
        // Transform balances to include entityType and entityName based on entity data
        const balancesWithMeta: CreditBalanceWithMeta[] = await Promise.all(
          balances.map(async (balance) => {
            try {
              // For now, treat all as entities since that's what we have in the API
              const entity = await entitiesApi.getById(balance.entityId);
              return {
                ...balance,
                entityType: "entity" as const,
                entityName: entity.name,
                balance: balance.totalCredits - balance.usedCredits,
              };
            } catch (error) {
              console.warn(
                `Could not fetch entity details for ${balance.entityId}:`,
                error,
              );
              return {
                ...balance,
                entityType: "entity" as const,
                entityName: `Entity ${balance.entityId}`,
                balance: balance.totalCredits - balance.usedCredits,
              };
            }
          }),
        );
        setCreditBalances(balancesWithMeta);
      } catch (error) {
        console.error("Failed to fetch credit balances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreditBalances();
  }, []);

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCredits(true);

    try {
      const addCreditsData: AddCreditsRequest = {
        entityId: addForm.entityId,
        amount: addForm.amount,
        description: addForm.description,
        type: "MANUAL",
      };

      const updatedBalance = await creditsApi.addCredits(addCreditsData);

      // Update the credit balances list
      setCreditBalances((prev) => {
        const existingIndex = prev.findIndex(
          (b) => b.entityId === addForm.entityId,
        );
        if (existingIndex >= 0) {
          // Update existing balance
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            totalCredits: updatedBalance.totalCredits,
            usedCredits: updatedBalance.usedCredits,
            balance: updatedBalance.totalCredits - updatedBalance.usedCredits,
            updatedAt: updatedBalance.updatedAt,
          };
          return updated;
        } else {
          // Add new balance entry
          const entityOption = entityOptions.find(
            (e) => e.id === addForm.entityId,
          );
          return [
            ...prev,
            {
              ...updatedBalance,
              entityType: addForm.entityType,
              entityName: entityOption?.name || `Entity ${addForm.entityId}`,
              balance: updatedBalance.totalCredits - updatedBalance.usedCredits,
              updatedAt: updatedBalance.updatedAt,
            },
          ];
        }
      });

      // Reset form
      setAddForm({
        entityType: "entity",
        entityId: "",
        amount: 0,
        description: "",
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits. Please try again.");
    } finally {
      setAddingCredits(false);
    }
  };

  // Fetch entity options when form is shown or entity type changes
  useEffect(() => {
    if (showAddForm && addForm.entityType === "entity") {
      const fetchEntities = async () => {
        try {
          const entities = await entitiesApi.getAll();
          setEntityOptions(entities.map((e) => ({ id: e.id, name: e.name })));
        } catch (error) {
          console.error("Failed to fetch entities:", error);
        }
      };
      fetchEntities();
    } else if (showAddForm && addForm.entityType === "organization") {
      const fetchOrganizations = async () => {
        try {
          const orgs = await organizationsApi.getAll();
          setEntityOptions(orgs.map((o) => ({ id: o.id, name: o.name })));
        } catch (error) {
          console.error("Failed to fetch organizations:", error);
        }
      };
      fetchOrganizations();
    }
  }, [showAddForm, addForm.entityType]);

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

      {/* Add Credits Form with Tabs */}
      {showAddForm && (
        <AddCreditsFormModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            // Refresh credit balances
            window.location.reload();
          }}
        />
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
                      {new Date(balance.updatedAt).toLocaleDateString()}
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

// Add Credits Form Modal with Tabs
interface AddCreditsFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddCreditsFormModal({ onClose, onSuccess }: AddCreditsFormModalProps) {
  const [activeTab, setActiveTab] = useState<
    "organization" | "entity" | "team"
  >("organization");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");

  // Organization tab state
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [organizations, setOrganizations] = useState<EntityOption[]>([]);

  // Entity tab state
  const [selectedEntityOrganizationId, setSelectedEntityOrganizationId] =
    useState("");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [entities, setEntities] = useState<EntityOption[]>([]);

  // Team tab state
  const [selectedTeamOrganizationId, setSelectedTeamOrganizationId] =
    useState("");
  const [selectedTeamEntityId, setSelectedTeamEntityId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState<EntityOption[]>([]);

  // Load organizations on mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await organizationsApi.getAll();
        setOrganizations(orgs.map((o) => ({ id: o.id, name: o.name })));
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      }
    };
    fetchOrganizations();
  }, []);

  // Load entities when organization is selected for entity tab
  useEffect(() => {
    if (selectedEntityOrganizationId) {
      const fetchEntities = async () => {
        try {
          const allEntities = await entitiesApi.getAll();
          // Filter entities by organization
          const orgEntities = allEntities.filter(
            (e) => e.organizationId === selectedEntityOrganizationId,
          );
          setEntities(orgEntities.map((e) => ({ id: e.id, name: e.name })));
        } catch (error) {
          console.error("Failed to fetch entities:", error);
        }
      };
      fetchEntities();
    } else {
      setEntities([]);
      setSelectedEntityId("");
    }
  }, [selectedEntityOrganizationId]);

  // Load entities for team tab when organization is selected
  useEffect(() => {
    if (selectedTeamOrganizationId) {
      const fetchEntitiesForTeams = async () => {
        try {
          const allEntities = await entitiesApi.getAll();
          const orgEntities = allEntities.filter(
            (e) => e.organizationId === selectedTeamOrganizationId,
          );
          setEntities(orgEntities.map((e) => ({ id: e.id, name: e.name })));
        } catch (error) {
          console.error("Failed to fetch entities:", error);
        }
      };
      fetchEntitiesForTeams();
    } else {
      setEntities([]);
      setSelectedTeamEntityId("");
      setTeams([]);
      setSelectedTeamId("");
    }
  }, [selectedTeamOrganizationId]);

  // Load teams when entity is selected for team tab
  useEffect(() => {
    if (selectedTeamEntityId) {
      const fetchTeams = async () => {
        try {
          const entityTeams = await teamsApi.getByEntity(selectedTeamEntityId);
          setTeams(entityTeams.map((t) => ({ id: t.id, name: t.name })));
        } catch (error) {
          console.error("Failed to fetch teams:", error);
        }
      };
      fetchTeams();
    } else {
      setTeams([]);
      setSelectedTeamId("");
    }
  }, [selectedTeamEntityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let entityId: string;

      if (activeTab === "organization") {
        entityId = selectedOrganizationId;
      } else if (activeTab === "entity") {
        entityId = selectedEntityId;
      } else {
        // For teams, we actually add credits to the entity that contains the team
        entityId = selectedTeamEntityId;
      }

      const addCreditsData: AddCreditsRequest = {
        entityId,
        amount,
        description: description || `Credits added to ${activeTab}`,
        type: "MANUAL",
      };

      await creditsApi.addCredits(addCreditsData);
      onSuccess();
    } catch (error) {
      console.error("Failed to add credits:", error);
      alert("Failed to add credits. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add Credits</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                {
                  id: "organization" as const,
                  name: "Organization",
                  icon: "🏢",
                },
                { id: "entity" as const, name: "Entity", icon: "🏛️" },
                { id: "team" as const, name: "Team", icon: "👥" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Amount *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Add credits to ${activeTab}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Tab-specific content */}
            {activeTab === "organization" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Organization *
                </label>
                <select
                  value={selectedOrganizationId}
                  onChange={(e) => setSelectedOrganizationId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === "entity" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Organization *
                  </label>
                  <select
                    value={selectedEntityOrganizationId}
                    onChange={(e) => {
                      setSelectedEntityOrganizationId(e.target.value);
                      setSelectedEntityId("");
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedEntityOrganizationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Entity *
                    </label>
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select an entity...</option>
                      {entities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Organization *
                  </label>
                  <select
                    value={selectedTeamOrganizationId}
                    onChange={(e) => {
                      setSelectedTeamOrganizationId(e.target.value);
                      setSelectedTeamEntityId("");
                      setSelectedTeamId("");
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select an organization...</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedTeamOrganizationId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Entity *
                    </label>
                    <select
                      value={selectedTeamEntityId}
                      onChange={(e) => {
                        setSelectedTeamEntityId(e.target.value);
                        setSelectedTeamId("");
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select an entity...</option>
                      {entities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedTeamEntityId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Team *
                    </label>
                    <select
                      value={selectedTeamId}
                      onChange={(e) => setSelectedTeamId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select a team...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Credits"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
