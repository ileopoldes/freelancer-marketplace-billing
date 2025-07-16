interface BillingJobStatsProps {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export function BillingJobStats({
  totalJobs,
  runningJobs,
  completedJobs,
  failedJobs,
}: BillingJobStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
        <p className="text-2xl font-bold text-gray-900">{totalJobs}</p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Running Jobs</h3>
        <p className="text-2xl font-bold text-primary-600">{runningJobs}</p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Completed Jobs</h3>
        <p className="text-2xl font-bold text-success-600">{completedJobs}</p>
      </div>
      <div className="card p-6">
        <h3 className="text-sm font-medium text-gray-500">Failed Jobs</h3>
        <p className="text-2xl font-bold text-error-600">{failedJobs}</p>
      </div>
    </div>
  );
}
