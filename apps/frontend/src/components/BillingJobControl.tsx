'use client'

import { useState } from 'react'
import { useBillingJobs, useRunBilling } from '@/hooks/api'
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils'
import type { BillingJob } from '@/lib/api'

export function BillingJobControl() {
  const { data: billingJobs = [], isLoading, isError } = useBillingJobs()
  const runBillingMutation = useRunBilling()
  const [asOfDate, setAsOfDate] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  const handleRunBilling = async () => {
    if (isRunning) return
    
    setIsRunning(true)
    try {
      await runBillingMutation.mutateAsync(asOfDate || undefined)
    } catch (error) {
      console.error('Failed to run billing:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // Sort jobs by creation date (newest first)
  const sortedJobs = [...billingJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '🕒'
      case 'RUNNING':
        return '⚡'
      case 'COMPLETED':
        return '✅'
      case 'FAILED':
        return '❌'
      default:
        return '❓'
    }
  }

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
    )
  }

  if (isError) {
    return (
      <div className="card p-6 border-error-200 bg-error-50">
        <p className="text-error-700">Failed to load billing jobs. Please try again.</p>
      </div>
    )
  }

  const runningJobs = billingJobs.filter(job => job.status === 'RUNNING').length
  const completedJobs = billingJobs.filter(job => job.status === 'COMPLETED').length
  const failedJobs = billingJobs.filter(job => job.status === 'FAILED').length

  return (
    <div className="space-y-6">
      {/* Billing Control */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Run Billing Job</h3>
        <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label htmlFor="asOfDate" className="block text-sm font-medium text-gray-700 mb-2">
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
            onClick={handleRunBilling}
            disabled={isRunning || runBillingMutation.isPending}
            className={`btn ${
              isRunning || runBillingMutation.isPending
                ? 'btn-secondary cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isRunning || runBillingMutation.isPending ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Running Billing...
              </>
            ) : (
              'Run Billing Job'
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
              Billing job started successfully! Check the job list below for progress.
            </p>
          </div>
        )}
      </div>

      {/* Job Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Jobs</h3>
          <p className="text-2xl font-bold text-gray-900">{billingJobs.length}</p>
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

      {/* Job History */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Billing Job History</h3>
          <p className="mt-1 text-sm text-gray-500">
            Real-time updates every 5 seconds for running jobs
          </p>
        </div>

        {sortedJobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No billing jobs found. Click "Run Billing Job" to start your first job.
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
                {sortedJobs.map((job) => (
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
                        <span className="font-medium">{job.contractsProcessed}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      {job.invoicesGenerated !== undefined ? (
                        <span className="font-medium">{job.invoicesGenerated}</span>
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

      {/* Error Messages */}
      {sortedJobs.some(job => job.status === 'FAILED' && job.errorMessage) && (
        <div className="card p-6 border-error-200 bg-error-50">
          <h3 className="text-lg font-medium text-error-800 mb-4">Recent Errors</h3>
          <div className="space-y-2">
            {sortedJobs
              .filter(job => job.status === 'FAILED' && job.errorMessage)
              .slice(0, 3)
              .map((job) => (
                <div key={job.id} className="text-sm">
                  <span className="font-medium text-error-700">
                    Job {job.id.substring(0, 8)}:
                  </span>
                  <span className="text-error-600 ml-2">{job.errorMessage}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

