import { apiClient } from "./client";

export interface MarketplaceEvent {
  id: string;
  name: string;
  description: string;
  eventType:
    | "PURCHASE"
    | "SUBSCRIPTION_CHANGE"
    | "USAGE_REPORT"
    | "BILLING_UPDATE"
    | "REFUND";
  source: string;
  timestamp: string;
  entityId: string;
  entityName?: string; // This may be populated on the frontend side
  amount?: number;
  currency?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  metadata?: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceEventRequest {
  name: string;
  description: string;
  eventType: MarketplaceEvent["eventType"];
  source: string;
  entityId: string;
  amount?: number;
  currency?: string;
  status: MarketplaceEvent["status"];
  metadata?: Record<string, any>;
}

export interface MarketplaceEventFilters {
  eventType?: MarketplaceEvent["eventType"];
  status?: MarketplaceEvent["status"];
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export const marketplaceEventsApi = {
  // Get all marketplace events with pagination and filters
  getAll: async (
    page = 1,
    limit = 10,
    filters?: MarketplaceEventFilters,
  ): Promise<{ data: MarketplaceEvent[]; total: number }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const response = await apiClient.get(
      `/api/marketplace-events?${params.toString()}`,
    );
    return response;
  },

  // Get marketplace event by ID
  getById: async (id: string): Promise<MarketplaceEvent> => {
    return await apiClient.get(`/api/marketplace-events/${id}`);
  },

  // Create a new marketplace event
  create: async (
    data: CreateMarketplaceEventRequest,
  ): Promise<MarketplaceEvent> => {
    return await apiClient.post("/api/marketplace-events", data);
  },

  // Update a marketplace event
  update: async (
    id: string,
    data: Partial<CreateMarketplaceEventRequest>,
  ): Promise<MarketplaceEvent> => {
    return await apiClient.patch(`/api/marketplace-events/${id}`, data);
  },

  // Delete a marketplace event
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/marketplace-events/${id}`);
  },

  // Get events by entity
  getByEntity: async (
    entityId: string,
    page = 1,
    limit = 10,
  ): Promise<{ data: MarketplaceEvent[]; total: number }> => {
    const response = await apiClient.get(
      `/api/marketplace-events/entity/${entityId}?page=${page}&limit=${limit}`,
    );
    return response;
  },
};
