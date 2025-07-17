"use client";

import { useState } from "react";
import { useBillingJobs, useRunBilling } from "@/hooks/api";
import { BillingJobStats } from "./BillingJobControl/BillingJobStats";
import { RunBillingControl } from "./BillingJobControl/RunBillingControl";
import { BillingJobHistory } from "./BillingJobControl/BillingJobHistory";
import { BillingJobErrors } from "./BillingJobControl/BillingJobErrors";

export function BillingJobControl() {
  const { data: billingJobs = [], isLoading, isError } = useBillingJobs();
  const runBillingMutation = useRunBilling();
  const [asOfDate, setAsOfDate] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBilling = async () => {
    if (isRunning) return;

    setIsRunning(true);
    try {
      await runBillingMutation.mutateAsync(asOfDate || undefined);
    } catch {
      // Error is already handled by the mutation's error state
    } finally {
      setIsRunning(false);
    }
  };

  // Sort jobs by creation date (newest first)
  const sortedJobs = [...billingJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6 border-error-200 bg-error-50">
        <p className="text-error-700">
          Failed to load billing jobs. Please try again.
        </p>
      </div>
    );
  }

  const runningJobs = billingJobs.filter(
    (job) => job.status === "RUNNING",
  ).length;
  const completedJobs = billingJobs.filter(
    (job) => job.status === "COMPLETED",
  ).length;
  const failedJobs = billingJobs.filter(
    (job) => job.status === "FAILED",
  ).length;

  return (
    <div className="space-y-6">
      <RunBillingControl
        asOfDate={asOfDate}
        setAsOfDate={setAsOfDate}
        isRunning={isRunning}
        onRunBilling={handleRunBilling}
        runBillingMutation={runBillingMutation}
      />

      <BillingJobStats
        totalJobs={billingJobs.length}
        runningJobs={runningJobs}
        completedJobs={completedJobs}
        failedJobs={failedJobs}
      />

      <BillingJobHistory jobs={sortedJobs} />

      <BillingJobErrors jobs={sortedJobs} />
    </div>
  );
}
