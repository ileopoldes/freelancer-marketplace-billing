import { apiClient } from "./client";

export interface Project {
  id: string;
  entityId: string;
  title: string;
  description: string;
  budget: number;
  currency: string;
  status: string;
  createdById: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    name: string;
    organization: {
      id: string;
      name: string;
    };
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateProjectRequest {
  entityId: string;
  title: string;
  description: string;
  budget: number;
  currency?: string;
  createdById: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  budget?: number;
  currency?: string;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export const projectsApi = {
  // Get all projects
  getAll: async (entityId?: string): Promise<Project[]> => {
    const params = entityId ? { entityId } : undefined;
    const response = await apiClient.get("/api/projects", { params });
    return response.data;
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get(`/api/projects/${id}`);
    return response.data;
  },

  // Create project
  create: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post("/api/projects", data);
    return response.data;
  },

  // Update project
  update: async (id: string, data: UpdateProjectRequest): Promise<Project> => {
    const response = await apiClient.patch(`/api/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/projects/${id}`);
  },
};
