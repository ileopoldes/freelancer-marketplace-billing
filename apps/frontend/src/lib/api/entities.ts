import { apiClient } from "./client";

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

export interface CreateEntityRequest {
  organizationId: string;
  name: string;
  description?: string;
  billingModel: string;
}

export interface UpdateEntityRequest {
  name?: string;
  description?: string;
  billingModel?: string;
}

export const entitiesApi = {
  // Get all entities
  getAll: async (): Promise<Entity[]> => {
    const response = await apiClient.get("/entities");
    return response.data;
  },

  // Get entity by ID
  getById: async (id: string): Promise<Entity> => {
    const response = await apiClient.get(`/entities/${id}`);
    return response.data;
  },

  // Create entity
  create: async (data: CreateEntityRequest): Promise<Entity> => {
    const response = await apiClient.post("/entities", data);
    return response.data;
  },

  // Update entity
  update: async (id: string, data: UpdateEntityRequest): Promise<Entity> => {
    const response = await apiClient.patch(`/entities/${id}`, data);
    return response.data;
  },

  // Delete entity
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entities/${id}`);
  },
};
