import { z } from 'zod'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// API Response Types
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  creditBalance: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  invoiceNumber: z.string(),
  subtotal: z.string(),
  discountAmount: z.string(),
  creditAmount: z.string(),
  total: z.string(),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']),
  issueDate: z.string(),
  dueDate: z.string(),
  createdAt: z.string(),
  customer: CustomerSchema.optional(),
})

export const BillingJobSchema = z.object({
  id: z.string(),
  asOfDate: z.string(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']),
  contractsProcessed: z.number().optional(),
  invoicesGenerated: z.number().optional(),
  totalBilled: z.string().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Customer = z.infer<typeof CustomerSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type BillingJob = z.infer<typeof BillingJobSchema>

// API Client
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Only set Content-Type header if we have a body
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    }
    
    if (options.body) {
      headers['Content-Type'] = 'application/json'
    }
    
    const response = await fetch(url, {
      headers,
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Customer endpoints
  async getCustomers(): Promise<Customer[]> {
    const data = await this.request<{ customers: Customer[] }>('/api/customers')
    return data.customers || []
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/api/customers/${id}`)
  }

  // Invoice endpoints
  async getInvoices(): Promise<Invoice[]> {
    const data = await this.request<{ invoices: Invoice[] }>('/api/invoices')
    return data.invoices || []
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/api/invoices/${id}`)
  }

  async getCustomerInvoices(customerId: string): Promise<Invoice[]> {
    const data = await this.request<{ invoices: Invoice[] }>(
      `/api/customers/${customerId}/invoices`
    )
    return data.invoices || []
  }

  // Billing job endpoints
  async runBilling(asOfDate?: string): Promise<{ message: string; asOfDate: string; status: string }> {
    const params = asOfDate ? `?asOf=${asOfDate}` : ''
    return this.request<{ message: string; asOfDate: string; status: string }>(`/api/billing/run${params}`, {
      method: 'POST',
    })
  }

  async getBillingJob(id: string): Promise<BillingJob> {
    return this.request<BillingJob>(`/api/billing/jobs/${id}`)
  }

  async getBillingJobs(): Promise<BillingJob[]> {
    const data = await this.request<{ jobs: BillingJob[] }>('/api/billing/jobs')
    return data.jobs || []
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

