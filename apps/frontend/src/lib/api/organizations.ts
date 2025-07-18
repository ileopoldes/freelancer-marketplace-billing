import { apiClient } from "./client";

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  billingEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  entities?: Entity[];
}

export interface Entity {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  billingModel: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  domain?: string;
  billingEmail: string;
  description?: string;
  billingModel: "PAY_AS_YOU_GO" | "PREPAID_CREDITS" | "SEAT_BASED";
}

export interface UpdateOrganizationRequest {
  name?: string;
  domain?: string;
  billingEmail?: string;
}

export const organizationsApi = {
  // Get all organizations
  getAll: async (): Promise<Organization[]> => {
    const response = await apiClient.get("/organizations");
    return response.data;
  },

  // Get organization by ID
  getById: async (id: string): Promise<Organization> => {
    const response = await apiClient.get(`/organizations/${id}`);
    return response.data;
  },

  // Create organization
  create: async (data: CreateOrganizationRequest): Promise<Organization> => {
    const response = await apiClient.post("/organizations", data);
    return response.data;
  },

  // Update organization
  update: async (
    id: string,
    data: UpdateOrganizationRequest,
  ): Promise<Organization> => {
    const response = await apiClient.patch(`/organizations/${id}`, data);
    return response.data;
  },

  // Delete organization
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/organizations/${id}`);
  },
};
