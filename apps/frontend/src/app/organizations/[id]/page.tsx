"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Organization, organizationsApi } from "@/lib/api/organizations";
import { Entity, entitiesApi } from "@/lib/api/entities";
import { EntityForm } from "@/components/EntityForm";
import { EntityList } from "@/components/EntityList";

interface OrganizationDetailProps {
  params: {
    id: string;
  };
}

export default function OrganizationDetailPage({
  params,
}: OrganizationDetailProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const data = await organizationsApi.getById(params.id);
      setOrganization(data);
      setEntities(data.entities || []);
    } catch (err) {
      setError("Failed to fetch organization");
      console.error("Error fetching organization:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [params.id]);

  const handleCreateEntity = async (data: any) => {
    try {
      await entitiesApi.create({ ...data, organizationId: params.id });
      setShowEntityForm(false);
      fetchOrganization();
    } catch (err) {
      console.error("Error creating entity:", err);
      throw err;
    }
  };

  const handleUpdateEntity = async (id: string, data: any) => {
    try {
      await entitiesApi.update(id, data);
      setEditingEntity(null);
      fetchOrganization();
    } catch (err) {
      console.error("Error updating entity:", err);
      throw err;
    }
  };

  const handleDeleteEntity = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entity?")) {
      try {
        await entitiesApi.delete(id);
        fetchOrganization();
      } catch (err) {
        console.error("Error deleting entity:", err);
        alert("Failed to delete entity");
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

  if (error || !organization) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error || "Organization not found"}</p>
        <button
          onClick={() => router.push("/organizations")}
          className="mt-4 text-indigo-600 hover:text-indigo-900"
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <button
          onClick={() => router.push("/organizations")}
          className="text-indigo-600 hover:text-indigo-900 mb-4"
        >
          ← Back to Organizations
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {organization.name}
        </h1>
        <div className="mt-2 text-sm text-gray-600">
          <p>Domain: {organization.domain || "None"}</p>
          <p>Billing Email: {organization.billingEmail}</p>
          <p>Status: {organization.status}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Entities</h2>
          <button
            onClick={() => setShowEntityForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Create Entity
          </button>
        </div>

        {showEntityForm && (
          <div className="mb-8">
            <EntityForm
              onSubmit={handleCreateEntity}
              onCancel={() => setShowEntityForm(false)}
            />
          </div>
        )}

        {editingEntity && (
          <div className="mb-8">
            <EntityForm
              entity={editingEntity}
              onSubmit={(data) => handleUpdateEntity(editingEntity.id, data)}
              onCancel={() => setEditingEntity(null)}
            />
          </div>
        )}

        <EntityList
          entities={entities}
          onEdit={setEditingEntity}
          onDelete={handleDeleteEntity}
        />
      </div>
    </div>
  );
}
