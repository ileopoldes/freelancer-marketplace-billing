import { apiClient } from "./client";

export interface Team {
  id: string;
  entityId: string;
  name: string;
  description?: string;
  teamLeadId?: string;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  teamLead?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateTeamRequest {
  entityId: string;
  name: string;
  description?: string;
  teamLeadId?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  teamLeadId?: string;
}

export interface EntityUser {
  id: string;
  entityId: string;
  userId: string;
  role: string;
  creditLimit: number;
  seatAllocation: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    globalRole?: string;
  };
}

export interface CreateEntityUserRequest {
  entityId: string;
  userId: string;
  role: string;
  creditLimit?: number;
  seatAllocation: number;
  teamId?: string;
}

export interface UpdateEntityUserRequest {
  role?: string;
  creditLimit?: number;
  seatAllocation?: number;
  status?: string;
  teamId?: string;
}

export const teamsApi = {
  // Get all teams for an entity
  getByEntity: async (entityId: string): Promise<Team[]> => {
    return await apiClient.get(`/api/teams?entityId=${entityId}`);
  },

  // Get team by ID
  getById: async (id: string): Promise<Team> => {
    return await apiClient.get(`/api/teams/${id}`);
  },

  // Create team
  create: async (data: CreateTeamRequest): Promise<Team> => {
    return await apiClient.post("/api/teams", data);
  },

  // Update team
  update: async (id: string, data: UpdateTeamRequest): Promise<Team> => {
    return await apiClient.patch(`/api/teams/${id}`, data);
  },

  // Delete team
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/teams/${id}`);
  },
};

export const entityUsersApi = {
  // Get all entity users (customers) for an entity
  getByEntity: async (entityId: string): Promise<EntityUser[]> => {
    return await apiClient.get(`/api/entity-users?entityId=${entityId}`);
  },

  // Get entity user by ID
  getById: async (id: string): Promise<EntityUser> => {
    return await apiClient.get(`/api/entity-users/${id}`);
  },

  // Create entity user (add customer to entity)
  create: async (data: CreateEntityUserRequest): Promise<EntityUser> => {
    return await apiClient.post("/api/entity-users", data);
  },

  // Update entity user
  update: async (
    id: string,
    data: UpdateEntityUserRequest,
  ): Promise<EntityUser> => {
    return await apiClient.patch(`/api/entity-users/${id}`, data);
  },

  // Delete entity user
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/entity-users/${id}`);
  },

  // Assign user to team
  assignToTeam: async (
    entityUserId: string,
    teamId: string,
  ): Promise<EntityUser> => {
    return await apiClient.patch(`/api/entity-users/${entityUserId}/team`, {
      teamId,
    });
  },

  // Remove user from team
  removeFromTeam: async (entityUserId: string): Promise<EntityUser> => {
    return await apiClient.patch(`/api/entity-users/${entityUserId}/team`, {
      teamId: null,
    });
  },
};
