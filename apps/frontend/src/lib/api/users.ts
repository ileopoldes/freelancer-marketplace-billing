import { apiClient } from "./client";
import { UserRole } from "@/lib/enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  entityId?: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  organizationId?: string;
  entityId?: string;
}

export const usersApi = {
  // Create a new user
  create: async (data: CreateUserRequest): Promise<User> => {
    return await apiClient.post("/api/users", data);
  },

  // Get all users with pagination
  getAll: async (
    page = 1,
    limit = 10,
  ): Promise<{ data: User[]; total: number }> => {
    const response = await apiClient.get(
      `/api/users?page=${page}&limit=${limit}`,
    );
    return response;
  },

  // Check if a username is available
  checkUsername: async (username: string): Promise<{ exists: boolean }> => {
    return await apiClient.get(
      `/api/users/check-username?username=${username}`,
    );
  },
};
