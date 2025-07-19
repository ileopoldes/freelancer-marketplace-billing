"use client";

import { useState, useEffect } from "react";
import { EntityForm } from "@/components/EntityForm";
import { EntityList } from "@/components/EntityList";
import { Entity, CreateEntityRequest } from "@/lib/api/entities";
import { Organization } from "@/lib/api/organizations";

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Implement actual API calls
    setLoading(false);
  }, []);

  const handleCreateEntity = async (data: CreateEntityRequest) => {
    // TODO: Implement actual API call
    console.log("Creating entity:", data);
    setShowForm(false);
  };

  const handleEditEntity = async (data: CreateEntityRequest) => {
    // TODO: Implement actual API call
    console.log("Updating entity:", data);
    setEditingEntity(null);
    setShowForm(false);
  };

  const handleDeleteEntity = async (id: string) => {
    // TODO: Implement actual API call
    console.log("Deleting entity:", id);
  };

  const filteredEntities =
    selectedOrganization === "all"
      ? entities
      : entities.filter(
          (entity) => entity.organizationId === selectedOrganization,
        );

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
          <h1 className="text-2xl font-semibold text-gray-900">Entities</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage entities and their billing configurations. Entities represent
            different business units or teams within organizations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => {
              setEditingEntity(null);
              setShowForm(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Entity
          </button>
        </div>
      </div>

      {/* Organization Filter */}
      <div className="mt-6">
        <label
          htmlFor="organization-filter"
          className="block text-sm font-medium text-gray-700"
        >
          Filter by Organization
        </label>
        <select
          id="organization-filter"
          value={selectedOrganization}
          onChange={(e) => setSelectedOrganization(e.target.value)}
          className="mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="all">All Organizations</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8">
        {showForm && (
          <div className="mb-8">
            <EntityForm
              entity={editingEntity || undefined}
              onSubmit={editingEntity ? handleEditEntity : handleCreateEntity}
              onCancel={() => {
                setShowForm(false);
                setEditingEntity(null);
              }}
            />
          </div>
        )}

        {/* Placeholder content when no entities exist */}
        {filteredEntities.length === 0 && !showForm && (
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No entities found
            </h3>
            <p className="text-gray-600 mb-4 max-w-sm mx-auto">
              {selectedOrganization === "all"
                ? "Get started by creating your first entity. Entities help you organize different business units and their billing configurations."
                : "No entities found for the selected organization. Try selecting a different organization or create a new entity."}
            </p>
            <button
              onClick={() => {
                setEditingEntity(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Entity
            </button>
          </div>
        )}

        {/* Entity List */}
        {filteredEntities.length > 0 && (
          <EntityList
            entities={filteredEntities}
            onEdit={(entity) => {
              setEditingEntity(entity);
              setShowForm(true);
            }}
            onDelete={handleDeleteEntity}
          />
        )}
      </div>
    </div>
  );
}
