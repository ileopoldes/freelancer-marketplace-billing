import { formatCurrency } from "@/lib/utils";

interface InvoiceStatsProps {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  pendingInvoices: number;
}

export function InvoiceStats({
  totalInvoices,
  totalRevenue,
  paidInvoices,
  pendingInvoices,
}: InvoiceStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
        <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
        <p className="text-2xl font-bold text-gray-900">
          {formatCurrency(totalRevenue)}
        </p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Paid Invoices</h3>
        <p className="text-2xl font-bold text-success-600">{paidInvoices}</p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Pending Invoices</h3>
        <p className="text-2xl font-bold text-warning-600">{pendingInvoices}</p>
      </div>
    </div>
  );
}
