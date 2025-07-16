import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";

interface BillingJob {
  id: string;
  status: string;
  asOfDate: string;
  contractsProcessed?: number;
  invoicesGenerated?: number;
  totalBilled?: number;
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
}

interface BillingJobHistoryProps {
  jobs: BillingJob[];
}

const getJobStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return "🕒";
    case "RUNNING":
      return "⚡";
    case "COMPLETED":
      return "✅";
    case "FAILED":
      return "❌";
    default:
      return "❓";
  }
};

export function BillingJobHistory({ jobs }: BillingJobHistoryProps) {
  return (
    <div className="card">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Billing Job History
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Real-time updates every 5 seconds for running jobs
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          No billing jobs found. Click &quot;Run Billing Job&quot; to start your
          first job.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Status</th>
                <th>As Of Date</th>
                <th>Contracts Processed</th>
                <th>Invoices Generated</th>
                <th>Total Billed</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="font-medium text-primary-600">
                    {job.id.substring(0, 8)}...
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <span>{getJobStatusIcon(job.status)}</span>
                      <span className={getStatusColor(job.status)}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  <td className="text-gray-900">
                    {new Date(job.asOfDate).toLocaleDateString()}
                  </td>
                  <td className="text-center">
                    {job.contractsProcessed !== undefined ? (
                      <span className="font-medium">
                        {job.contractsProcessed}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    {job.invoicesGenerated !== undefined ? (
                      <span className="font-medium">
                        {job.invoicesGenerated}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {job.totalBilled ? (
                      <span className="font-medium text-success-600">
                        {formatCurrency(job.totalBilled)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="text-gray-500">
                    {formatDateTime(job.createdAt)}
                  </td>
                  <td className="text-gray-500">
                    {formatDateTime(job.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
