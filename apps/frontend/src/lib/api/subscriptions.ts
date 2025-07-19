import { apiClient } from "./client";

export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: "MONTHLY" | "YEARLY";
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionRequest {
  name: string;
  description: string;
  price: number;
  billingPeriod: "MONTHLY" | "YEARLY";
  features: string[];
}

export const subscriptionsApi = {
  // Get all subscriptions with pagination
  getAll: async (
    page = 1,
    limit = 10,
  ): Promise<{ data: Subscription[]; total: number }> => {
    const response = await apiClient.get(
      `/api/subscriptions?page=${page}&limit=${limit}`,
    );
    return response;
  },

  // Get subscription by ID
  getById: async (id: string): Promise<Subscription> => {
    return await apiClient.get(`/api/subscriptions/${id}`);
  },

  // Create a new subscription
  create: async (data: CreateSubscriptionRequest): Promise<Subscription> => {
    return await apiClient.post("/api/subscriptions", data);
  },

  // Update a subscription
  update: async (
    id: string,
    data: Partial<CreateSubscriptionRequest>,
  ): Promise<Subscription> => {
    return await apiClient.patch(`/api/subscriptions/${id}`, data);
  },

  // Delete a subscription
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/subscriptions/${id}`);
  },

  // Toggle subscription active status
  toggleActive: async (id: string): Promise<Subscription> => {
    return await apiClient.patch(`/api/subscriptions/${id}/toggle-active`);
  },
};
