"use client";

import { useState } from "react";
import {
  Organization,
  CreateOrganizationRequest,
} from "@/lib/api/organizations";

interface OrganizationFormProps {
  organization?: Organization;
  onSubmit: (data: CreateOrganizationRequest) => Promise<void>;
  onCancel: () => void;
}

export function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
}: OrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: organization?.name || "",
    domain: organization?.domain || "",
    billingEmail: organization?.billingEmail || "",
    description: "",
    billingModel:
      (organization as any)?.billingModel || ("SEAT_BASED" as const),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError("Failed to save organization");
      console.error("Error saving organization:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {organization ? "Edit Organization" : "Create Organization"}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="domain"
            className="block text-sm font-medium text-gray-700"
          >
            Domain
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="billingEmail"
            className="block text-sm font-medium text-gray-700"
          >
            Billing Email *
          </label>
          <input
            type="email"
            id="billingEmail"
            name="billingEmail"
            value={formData.billingEmail}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label
            htmlFor="billingModel"
            className="block text-sm font-medium text-gray-700"
          >
            Billing Model *
          </label>
          <select
            id="billingModel"
            name="billingModel"
            value={formData.billingModel}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="SEAT_BASED">Seat-Based Subscription</option>
            <option value="PAY_AS_YOU_GO">Pay-As-You-Go</option>
            <option value="PREPAID_CREDITS">Prepaid Credits</option>
          </select>
          {organization && (
            <p className="mt-1 text-sm text-gray-500">
              You can now edit the billing model for existing organizations.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : organization ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
