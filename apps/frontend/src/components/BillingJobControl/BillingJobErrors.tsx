interface BillingJob {
  id: string;
  status: string;
  errorMessage?: string;
}

interface BillingJobErrorsProps {
  jobs: BillingJob[];
}

export function BillingJobErrors({ jobs }: BillingJobErrorsProps) {
  const errorJobs = jobs.filter(
    (job) => job.status === "FAILED" && job.errorMessage,
  );

  if (errorJobs.length === 0) {
    return null;
  }

  return (
    <div className="card p-6 border-error-200 bg-error-50">
      <h3 className="text-lg font-medium text-error-800 mb-4">Recent Errors</h3>
      <div className="space-y-2">
        {errorJobs.slice(0, 3).map((job) => (
          <div key={job.id} className="text-sm">
            <span className="font-medium text-error-700">
              Job {job.id.substring(0, 8)}:
            </span>
            <span className="text-error-600 ml-2">{job.errorMessage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
