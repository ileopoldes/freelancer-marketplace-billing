"use client";

import { useState } from "react";
import { useInvoices } from "@/hooks/api";
import { debounce } from "@/lib/utils";
import { InvoiceStats } from "./InvoiceTable/InvoiceStats";
import { InvoiceFilters } from "./InvoiceTable/InvoiceFilters";
import { InvoiceTableContent } from "./InvoiceTable/InvoiceTableContent";

export function InvoiceTable() {
  const { data: invoices = [], isLoading, isError } = useInvoices();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    "ALL" as "ALL" | "PENDING" | "PAID" | "OVERDUE",
  );
  const [sortBy, setSortBy] = useState(
    "issueDate" as "invoiceNumber" | "total" | "issueDate",
  );
  const [sortOrder, setSortOrder] = useState("desc" as "asc" | "desc");

  // Filter and sort invoices
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "invoiceNumber":
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
        break;
      case "total":
        comparison = parseFloat(a.total) - parseFloat(b.total);
        break;
      case "issueDate":
        comparison =
          new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  const handleSort = (field: "invoiceNumber" | "total" | "issueDate") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (isLoading || isError) {
    return (
      <div className="card p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-error-700">
            Failed to load invoices. Please try again.
          </p>
        )}
      </div>
    );
  }

  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + parseFloat(invoice.total),
    0,
  );
  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "PAID",
  ).length;
  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === "PENDING",
  ).length;

  return (
    <div className="space-y-6">
      <InvoiceStats
        totalInvoices={totalInvoices}
        totalRevenue={totalRevenue}
        paidInvoices={paidInvoices}
        pendingInvoices={pendingInvoices}
      />

      <div className="card">
        <InvoiceFilters
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={debouncedSearch}
        />

        <InvoiceTableContent
          invoices={sortedInvoices}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}
