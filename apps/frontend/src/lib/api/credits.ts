import { apiClient } from "./client";

export interface CreditBalance {
  id: string;
  entityId: string;
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    name: string;
    organizationId: string;
  };
}

export interface CreditPackage {
  id: string;
  name: string;
  creditsAmount: number;
  price: number;
  description?: string;
  active: boolean;
}

export interface PurchaseCreditsRequest {
  entityId: string;
  packageId: string;
  purchasedByUserId: string;
}

export interface AddCreditsRequest {
  entityId: string;
  amount: number;
  description: string;
  type?: "MANUAL" | "REFUND" | "ADJUSTMENT" | "PROMOTIONAL";
}

export interface CreditTransaction {
  id: string;
  entityId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  metadata?: any;
  createdAt: string;
}

export const creditsApi = {
  // Get all credit balances
  getAllBalances: async (): Promise<CreditBalance[]> => {
    return await apiClient.get("/api/credits/balances");
  },

  // Get balance for specific entity
  getBalance: async (entityId: string): Promise<CreditBalance> => {
    return await apiClient.get(`/api/credits/balance/${entityId}`);
  },

  // Get credit history for entity
  getHistory: async (
    entityId: string,
    limit?: number,
    offset?: number,
  ): Promise<CreditTransaction[]> => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const queryString = params.toString();
    const url = `/api/credits/history/${entityId}${queryString ? `?${queryString}` : ""}`;

    return await apiClient.get(url);
  },

  // Get available credit packages
  getPackages: async (): Promise<CreditPackage[]> => {
    return await apiClient.get("/api/credits/packages");
  },

  // Purchase credits using a package
  purchaseCredits: async (
    data: PurchaseCreditsRequest,
  ): Promise<CreditBalance> => {
    return await apiClient.post("/api/credits/purchase", data);
  },

  // Add credits manually (admin only)
  addCredits: async (data: AddCreditsRequest): Promise<CreditBalance> => {
    return await apiClient.post("/api/credits/add", data);
  },

  // Deduct credits
  deductCredits: async (data: {
    entityId: string;
    amount: number;
    userId: string;
    reason: string;
  }): Promise<CreditBalance> => {
    return await apiClient.post("/api/credits/deduct", data);
  },

  // Get credit balances by type (organization, entity, customer)
  getBalancesByType: async (
    entityType: "organization" | "entity" | "customer",
    searchTerm?: string,
  ): Promise<CreditBalance[]> => {
    const params = new URLSearchParams();
    params.append("type", entityType);
    if (searchTerm) params.append("search", searchTerm);

    return await apiClient.get(`/api/credits/balances?${params.toString()}`);
  },
};
