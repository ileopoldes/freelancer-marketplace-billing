"use client";

import { useState, useEffect } from "react";
import { UserForm } from "@/components/UserForm";
import { UserRole } from "@/lib/enums";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  entityId?: string;
  organizationName?: string;
  entityName?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // TODO: Replace with actual API call
        console.log("Fetching users...");
        setUsers([]);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleAddUser = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    organizationId?: string;
    entityId?: string;
    organizationName?: string;
    entityName?: string;
  }) => {
    try {
      // TODO: Replace with actual API call
      console.log("Adding user:", userData);

      const newUser: User = {
        id: `temp-${Date.now()}`,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        organizationId: userData.organizationId,
        entityId: userData.entityId,
        organizationName: userData.organizationName,
        entityName: userData.entityName,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [...prev, newUser]);
      setShowAddUserForm(false);
      setSelectedRole(null);
    } catch (error) {
      console.error("Failed to add user:", error);
      throw error;
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowAddUserForm(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Customer Management
        </h1>
        <p className="text-gray-600">
          Create and manage users with different roles in the marketplace
        </p>
      </div>

      {!showAddUserForm && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Select User Role to Create
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => handleRoleSelect(UserRole.FREELANCER)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Freelancer
                </h3>
                <p className="text-sm text-gray-600">
                  Independent contractors who work on projects. No organization
                  or entity required.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.ORGANIZATION_ADMIN)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Organization Admin
                </h3>
                <p className="text-sm text-gray-600">
                  Administrators who manage organizations and their entities.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.ENTITY_ADMIN)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Entity Admin
                </h3>
                <p className="text-sm text-gray-600">
                  Administrators who manage specific entities within an
                  organization.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.USER)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Regular User
                </h3>
                <p className="text-sm text-gray-600">
                  Standard users who belong to an entity within an organization.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.TEAM_LEAD)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Team Lead
                </h3>
                <p className="text-sm text-gray-600">
                  Team leaders who manage teams within an entity.
                </p>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect(UserRole.ADMIN)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  System Admin
                </h3>
                <p className="text-sm text-gray-600">
                  System administrators with full access to all platform
                  features.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {showAddUserForm && selectedRole && (
        <div className="mb-8">
          <UserForm
            role={selectedRole}
            onSubmit={handleAddUser}
            onCancel={() => {
              setShowAddUserForm(false);
              setSelectedRole(null);
            }}
          />
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Users</h2>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No users created yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Select a role above to create your first user.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                      {user.organizationName && (
                        <span className="text-xs text-gray-500">
                          Org: {user.organizationName}
                        </span>
                      )}
                      {user.entityName && (
                        <span className="text-xs text-gray-500">
                          Entity: {user.entityName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status}
                    </span>
                    <button className="text-sm text-indigo-600 hover:text-indigo-900">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
