import { apiClient } from "./client";
import { BillingModel } from "../enums";

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

export interface CreateEntityRequest {
  name: string;
  description?: string;
  billingModel: BillingModel;
  organizationId: string;
}

export interface UpdateEntityRequest {
  name?: string;
  description?: string;
  billingModel?: BillingModel;
  organizationId?: string;
}

export const entitiesApi = {
  // Get all entities
  getAll: async (): Promise<Entity[]> => {
    return await apiClient.get("/api/entities");
  },

  // Get entities by organization
  getByOrganization: async (organizationId: string): Promise<Entity[]> => {
    return await apiClient.get(
      `/api/entities?organizationId=${organizationId}`,
    );
  },

  // Get entity by ID
  getById: async (id: string): Promise<Entity> => {
    return await apiClient.get(`/api/entities/${id}`);
  },

  // Create entity
  create: async (data: CreateEntityRequest): Promise<Entity> => {
    return await apiClient.post("/api/entities", data);
  },

  // Update entity
  update: async (id: string, data: UpdateEntityRequest): Promise<Entity> => {
    return await apiClient.patch(`/api/entities/${id}`, data);
  },

  // Delete entity
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/entities/${id}`);
  },

  // Check access
  checkAccess: async (id: string): Promise<{ hasAccess: boolean }> => {
    return await apiClient.get(`/api/entities/${id}/access`);
  },
};
