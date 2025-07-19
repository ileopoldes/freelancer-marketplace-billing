"use client";

import { useState, useEffect } from "react";
import { UserRole } from "@/lib/enums";
import { organizationsApi } from "@/lib/api/organizations";
import { entitiesApi } from "@/lib/api/entities";

interface Organization {
  id: string;
  name: string;
}

interface Entity {
  id: string;
  name: string;
  organizationId: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  organizationId: string;
  entityId: string;
  role: UserRole;
  organizationName?: string;
  entityName?: string;
}

interface UserFormProps {
  role: UserRole;
  onSubmit: (userData: UserFormData) => Promise<void>;
  onCancel: () => void;
}

export function UserForm({ role, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    organizationId: "",
    entityId: "",
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Determine if organization and entity are required based on role
  const requiresOrganization = ![UserRole.FREELANCER, UserRole.ADMIN].includes(
    role,
  );
  const requiresEntity = [
    UserRole.USER,
    UserRole.ENTITY_ADMIN,
    UserRole.TEAM_LEAD,
  ].includes(role);

  useEffect(() => {
    if (requiresOrganization) {
      fetchOrganizations();
    }
  }, [requiresOrganization]);

  useEffect(() => {
    if (requiresEntity && formData.organizationId) {
      fetchEntities(formData.organizationId);
    } else {
      setEntities([]);
      setFormData((prev) => ({ ...prev, entityId: "" }));
    }
  }, [requiresEntity, formData.organizationId]);

  const fetchOrganizations = async () => {
    try {
      setLoadingOrganizations(true);
      const orgs = await organizationsApi.getAll();
      setOrganizations(orgs);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const fetchEntities = async (organizationId: string) => {
    try {
      setLoadingEntities(true);
      const entitiesList = await entitiesApi.getByOrganization(organizationId);
      setEntities(entitiesList);
    } catch (error) {
      console.error("Failed to fetch entities:", error);
    } finally {
      setLoadingEntities(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (requiresOrganization && !formData.organizationId) {
      newErrors.organizationId = "Organization is required";
    }

    if (requiresEntity && !formData.entityId) {
      newErrors.entityId = "Entity is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const selectedOrganization = organizations.find(
        (org) => org.id === formData.organizationId,
      );
      const selectedEntity = entities.find(
        (entity) => entity.id === formData.entityId,
      );

      await onSubmit({
        ...formData,
        role,
        organizationName: selectedOrganization?.name,
        entityName: selectedEntity?.name,
      });
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.FREELANCER:
        return "Freelancer";
      case UserRole.ORGANIZATION_ADMIN:
        return "Organization Admin";
      case UserRole.ENTITY_ADMIN:
        return "Entity Admin";
      case UserRole.USER:
        return "Regular User";
      case UserRole.TEAM_LEAD:
        return "Team Lead";
      case UserRole.ADMIN:
        return "System Admin";
      default:
        return role;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          Create {getRoleDisplayName(role)}
        </h2>
        <p className="text-sm text-gray-600">
          Fill in the details below to create a new{" "}
          {getRoleDisplayName(role).toLowerCase()}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.firstName ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.lastName ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.email ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.username ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.password ? "border-red-300" : "border-gray-300"
              }`}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.confirmPassword ? "border-red-300" : "border-gray-300"
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {requiresOrganization && (
          <div>
            <label
              htmlFor="organizationId"
              className="block text-sm font-medium text-gray-700"
            >
              Organization *
            </label>
            <select
              id="organizationId"
              name="organizationId"
              value={formData.organizationId}
              onChange={handleChange}
              disabled={loadingOrganizations}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.organizationId ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">
                {loadingOrganizations
                  ? "Loading organizations..."
                  : "Select an organization"}
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.organizationId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.organizationId}
              </p>
            )}
          </div>
        )}

        {requiresEntity && (
          <div>
            <label
              htmlFor="entityId"
              className="block text-sm font-medium text-gray-700"
            >
              Entity *
            </label>
            <select
              id="entityId"
              name="entityId"
              value={formData.entityId}
              onChange={handleChange}
              disabled={loadingEntities || !formData.organizationId}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.entityId ? "border-red-300" : "border-gray-300"
              }`}
            >
              <option value="">
                {loadingEntities
                  ? "Loading entities..."
                  : !formData.organizationId
                    ? "Select an organization first"
                    : "Select an entity"}
              </option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name}
                </option>
              ))}
            </select>
            {errors.entityId && (
              <p className="mt-1 text-sm text-red-600">{errors.entityId}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}
