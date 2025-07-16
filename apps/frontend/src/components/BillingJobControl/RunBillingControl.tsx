import { UseMutationResult } from "@tanstack/react-query";

interface RunBillingControlProps {
  asOfDate: string;
  setAsOfDate: (date: string) => void;
  isRunning: boolean;
  onRunBilling: () => void;
  runBillingMutation: UseMutationResult<unknown, Error, string | undefined>;
}

export function RunBillingControl({
  asOfDate,
  setAsOfDate,
  isRunning,
  onRunBilling,
  runBillingMutation,
}: RunBillingControlProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Run Billing Job
      </h3>
      <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex-1">
          <label
            htmlFor="asOfDate"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            As Of Date (optional)
          </label>
          <input
            type="date"
            id="asOfDate"
            value={asOfDate}
            onChange={(e) => setAsOfDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Leave empty for current date"
          />
          <p className="mt-1 text-xs text-gray-500">
            Leave empty to run billing for the current date
          </p>
        </div>
        <button
          onClick={onRunBilling}
          disabled={isRunning || runBillingMutation.isPending}
          className={`btn ${
            isRunning || runBillingMutation.isPending
              ? "btn-secondary cursor-not-allowed"
              : "btn-primary"
          }`}
        >
          {isRunning || runBillingMutation.isPending ? (
            <>
              <span className="animate-spin mr-2">⚡</span>
              Running Billing...
            </>
          ) : (
            "Run Billing Job"
          )}
        </button>
      </div>

      {runBillingMutation.isError && (
        <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
          <p className="text-sm text-error-700">
            Failed to run billing job. Please try again.
          </p>
        </div>
      )}

      {runBillingMutation.isSuccess && (
        <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-md">
          <p className="text-sm text-success-700">
            Billing job started successfully! Check the job list below for
            progress.
          </p>
        </div>
      )}
    </div>
  );
}
