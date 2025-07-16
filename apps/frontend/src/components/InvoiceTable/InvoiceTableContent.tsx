import { formatCurrency, formatDate, getStatusColor } from "@/lib/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customer?: {
    name: string;
    email: string;
  };
  status: string;
  total: string;
  subtotal: string;
  discountAmount: string;
  creditAmount: string;
  issueDate: string;
  dueDate: string;
}

interface InvoiceTableContentProps {
  invoices: Invoice[];
  sortBy: "invoiceNumber" | "total" | "issueDate";
  sortOrder: "asc" | "desc";
  onSort: (field: "invoiceNumber" | "total" | "issueDate") => void;
  searchTerm: string;
  statusFilter: "ALL" | "PENDING" | "PAID" | "OVERDUE";
}

export function InvoiceTableContent({
  invoices,
  sortBy,
  sortOrder,
  onSort,
  searchTerm,
  statusFilter,
}: InvoiceTableContentProps) {
  if (invoices.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {searchTerm || statusFilter !== "ALL"
          ? "No invoices found matching your criteria."
          : "No invoices found."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>
              <button
                onClick={() => onSort("invoiceNumber")}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Invoice Number</span>
                {sortBy === "invoiceNumber" && (
                  <span className="text-primary-500">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            </th>
            <th>Customer</th>
            <th>Status</th>
            <th>
              <button
                onClick={() => onSort("total")}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Total</span>
                {sortBy === "total" && (
                  <span className="text-primary-500">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            </th>
            <th>Subtotal</th>
            <th>Discount</th>
            <th>Credits</th>
            <th>
              <button
                onClick={() => onSort("issueDate")}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <span>Issue Date</span>
                {sortBy === "issueDate" && (
                  <span className="text-primary-500">
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </button>
            </th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td className="font-medium text-primary-600">
                {invoice.invoiceNumber}
              </td>
              <td>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {invoice.customer?.name || "Unknown Customer"}
                  </div>
                  <div className="text-gray-500">
                    {invoice.customer?.email || ""}
                  </div>
                </div>
              </td>
              <td>
                <span className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </span>
              </td>
              <td className="font-semibold text-gray-900">
                {formatCurrency(invoice.total)}
              </td>
              <td className="text-gray-500">
                {formatCurrency(invoice.subtotal)}
              </td>
              <td className="text-gray-500">
                {parseFloat(invoice.discountAmount) > 0
                  ? `-${formatCurrency(invoice.discountAmount)}`
                  : formatCurrency(0)}
              </td>
              <td className="text-gray-500">
                {parseFloat(invoice.creditAmount) > 0
                  ? `-${formatCurrency(invoice.creditAmount)}`
                  : formatCurrency(0)}
              </td>
              <td className="text-gray-500">{formatDate(invoice.issueDate)}</td>
              <td className="text-gray-500">{formatDate(invoice.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
