import { apiClient } from "./client";
import { BillingModel } from "../enums";

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
  billingModel: BillingModel;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  domain?: string;
  billingEmail: string;
  description?: string;
  billingModel: BillingModel;
}

export interface UpdateOrganizationRequest {
  name?: string;
  domain?: string;
  billingEmail?: string;
  billingModel?: BillingModel;
}

export const organizationsApi = {
  // Get all organizations
  getAll: async (): Promise<Organization[]> => {
    return await apiClient.get("/api/organizations");
  },

  // Get organization by ID
  getById: async (id: string): Promise<Organization> => {
    return await apiClient.get(`/api/organizations/${id}`);
  },

  // Create organization
  create: async (data: CreateOrganizationRequest): Promise<Organization> => {
    return await apiClient.post("/api/organizations", data);
  },

  // Update organization
  update: async (
    id: string,
    data: UpdateOrganizationRequest,
  ): Promise<Organization> => {
    return await apiClient.patch(`/api/organizations/${id}`, data);
  },

  // Delete organization
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/organizations/${id}`);
  },
};
