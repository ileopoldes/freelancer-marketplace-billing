interface InvoiceFiltersProps {
  statusFilter: "ALL" | "PENDING" | "PAID" | "OVERDUE";
  onStatusFilterChange: (
    status: "ALL" | "PENDING" | "PAID" | "OVERDUE",
  ) => void;
  onSearchChange: (searchTerm: string) => void;
}

export function InvoiceFilters({
  statusFilter,
  onStatusFilterChange,
  onSearchChange,
}: InvoiceFiltersProps) {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <h3 className="text-lg font-medium text-gray-900">Invoice List</h3>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusFilterChange(e.target.value as typeof statusFilter)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <input
            type="text"
            placeholder="Search invoices..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
