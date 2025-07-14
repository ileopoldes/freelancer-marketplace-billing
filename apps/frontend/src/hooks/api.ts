"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { Customer, Invoice, BillingJob } from "@/lib/api";

// Query keys
export const queryKeys = {
  customers: ["customers"] as const,
  customer: (id: string) => ["customers", id] as const,
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
  customerInvoices: (customerId: string) =>
    ["customers", customerId, "invoices"] as const,
  billingJobs: ["billing-jobs"] as const,
  billingJob: (id: string) => ["billing-jobs", id] as const,
  health: ["health"] as const,
};

// Customer hooks
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiClient.getCustomers(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: () => apiClient.getCustomer(id),
    enabled: !!id,
  });
}

// Invoice hooks
export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices,
    queryFn: () => apiClient.getInvoices(),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => apiClient.getInvoice(id),
    enabled: !!id,
  });
}

export function useCustomerInvoices(customerId: string) {
  return useQuery({
    queryKey: queryKeys.customerInvoices(customerId),
    queryFn: () => apiClient.getCustomerInvoices(customerId),
    enabled: !!customerId,
  });
}

// Billing job hooks
export function useBillingJobs() {
  return useQuery({
    queryKey: queryKeys.billingJobs,
    queryFn: () => apiClient.getBillingJobs(),
    refetchInterval: 5 * 1000, // Refetch every 5 seconds for real-time updates
  });
}

export function useBillingJob(id: string) {
  return useQuery({
    queryKey: queryKeys.billingJob(id),
    queryFn: () => apiClient.getBillingJob(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Stop refetching when job is completed or failed
      return query.state.data?.status === "RUNNING" ||
        query.state.data?.status === "PENDING"
        ? 2000
        : false;
    },
  });
}

// Mutation hooks
export function useRunBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asOfDate?: string) => apiClient.runBilling(asOfDate),
    onSuccess: () => {
      // Invalidate and refetch billing jobs
      queryClient.invalidateQueries({ queryKey: queryKeys.billingJobs });
      // Also invalidate invoices as new ones might be generated
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
    },
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30 * 1000, // Check every 30 seconds
    retry: 1,
  });
}
