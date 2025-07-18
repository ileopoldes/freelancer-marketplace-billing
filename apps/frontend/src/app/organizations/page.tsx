"use client";

import { useState, useEffect } from "react";
import { Organization, organizationsApi } from "@/lib/api/organizations";
import { OrganizationForm } from "@/components/OrganizationForm";
import { OrganizationList } from "@/components/OrganizationList";

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<Organization | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.getAll();
      setOrganizations(data);
    } catch (err) {
      setError("Failed to fetch organizations");
      console.error("Error fetching organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrganization = async (data: any) => {
    try {
      await organizationsApi.create(data);
      setShowForm(false);
      fetchOrganizations();
    } catch (err) {
      console.error("Error creating organization:", err);
      throw err;
    }
  };

  const handleUpdateOrganization = async (id: string, data: any) => {
    try {
      await organizationsApi.update(id, data);
      setEditingOrganization(null);
      fetchOrganizations();
    } catch (err) {
      console.error("Error updating organization:", err);
      throw err;
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this organization?")) {
      try {
        await organizationsApi.delete(id);
        fetchOrganizations();
      } catch (err) {
        console.error("Error deleting organization:", err);
        alert("Failed to delete organization");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create Organization
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8">
          <OrganizationForm
            onSubmit={handleCreateOrganization}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingOrganization && (
        <div className="mb-8">
          <OrganizationForm
            organization={editingOrganization}
            onSubmit={(data) =>
              handleUpdateOrganization(editingOrganization.id, data)
            }
            onCancel={() => setEditingOrganization(null)}
          />
        </div>
      )}

      <OrganizationList
        organizations={organizations}
        onEdit={setEditingOrganization}
        onDelete={handleDeleteOrganization}
      />
    </div>
  );
}
