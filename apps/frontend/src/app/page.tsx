'use client'

import { useState } from 'react'
import { CustomerDashboard } from '@/components/CustomerDashboard'
import { InvoiceTable } from '@/components/InvoiceTable'
import { BillingJobControl } from '@/components/BillingJobControl'
import { HealthStatus } from '@/components/HealthStatus'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices' | 'billing'>('customers')

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Health Status */}
      <div className="mb-6">
        <HealthStatus />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('customers')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'customers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invoices'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`pb-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'billing'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing Jobs
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'customers' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Dashboard</h2>
            <CustomerDashboard />
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Management</h2>
            <InvoiceTable />
          </div>
        )}

        {activeTab === 'billing' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Operations</h2>
            <BillingJobControl />
          </div>
        )}
      </div>
    </div>
  )
}

