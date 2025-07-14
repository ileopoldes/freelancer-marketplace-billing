"use client";

import { useHealthCheck } from "@/hooks/api";
import { formatRelativeTime } from "@/lib/utils";

export function HealthStatus() {
  const { data: health, isLoading, isError } = useHealthCheck();

  if (isLoading) {
    return (
      <div className="card p-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse mr-3" />
          <span className="text-sm text-gray-500">Checking API status...</span>
        </div>
      </div>
    );
  }

  if (isError || !health) {
    return (
      <div className="card p-4 border-error-200 bg-error-50">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-error-500 rounded-full mr-3" />
          <span className="text-sm text-error-700">
            API is not responding. Please check the backend service.
          </span>
        </div>
      </div>
    );
  }

  const isHealthy = health.status === "ok";

  return (
    <div
      className={`card p-4 ${
        isHealthy
          ? "border-success-200 bg-success-50"
          : "border-warning-200 bg-warning-50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-3 ${
              isHealthy ? "bg-success-500" : "bg-warning-500"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              isHealthy ? "text-success-700" : "text-warning-700"
            }`}
          >
            API Status: {isHealthy ? "Healthy" : "Warning"}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Last checked: {formatRelativeTime(health.timestamp)}
        </div>
      </div>
    </div>
  );
}
