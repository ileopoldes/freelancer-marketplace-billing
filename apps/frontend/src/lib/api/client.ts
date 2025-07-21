const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Simple API client for making HTTP requests
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add JWT token if available (only on client side)
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get(
    endpoint: string,
    options: { params?: Record<string, string> } = {},
  ) {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async patch(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Return empty object for successful DELETE requests
    return {};
  }

  // Extended API methods for specific endpoints

  // Customer endpoints
  async getCustomers() {
    const data = await this.get("/api/customers");
    return data.customers || [];
  }

  async getCustomer(id: string) {
    return this.get(`/api/customers/${id}`);
  }

  // Invoice endpoints
  async getInvoices() {
    const data = await this.get("/api/invoices");
    return data.invoices || [];
  }

  async getInvoice(id: string) {
    return this.get(`/api/invoices/${id}`);
  }

  async getCustomerInvoices(customerId: string) {
    const data = await this.get(`/api/customers/${customerId}/invoices`);
    return data.invoices || [];
  }

  // Billing job endpoints
  async runBilling(asOfDate?: string) {
    const params = asOfDate ? `?asOf=${asOfDate}` : "";
    return this.post(`/api/billing/run${params}`);
  }

  async getBillingJob(id: string) {
    return this.get(`/api/billing/jobs/${id}`);
  }

  async getBillingJobs() {
    const data = await this.get("/api/billing/jobs");
    return data.jobs || [];
  }

  // Health check
  async healthCheck() {
    return this.get("/api/health");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
