'use client'

import { useState } from 'react'
import { useInvoices } from '@/hooks/api'
import { formatCurrency, formatDate, getStatusColor, debounce } from '@/lib/utils'
import type { Invoice } from '@/lib/api'

export function InvoiceTable() {
  const { data: invoices = [], isLoading, isError } = useInvoices()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'OVERDUE'>('ALL')
  const [sortBy, setSortBy] = useState<'invoiceNumber' | 'total' | 'issueDate'>('issueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || invoice.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'invoiceNumber':
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber)
        break
      case 'total':
        comparison = parseFloat(a.total) - parseFloat(b.total)
        break
      case 'issueDate':
        comparison = new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value)
  }, 300)

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
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
        <p className="text-error-700">Failed to load invoices. Please try again.</p>
      </div>
    )
  }

  const totalInvoices = invoices.length
  const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total), 0)
  const paidInvoices = invoices.filter(invoice => invoice.status === 'PAID').length
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'PENDING').length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
          <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
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

      {/* Invoice Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h3 className="text-lg font-medium text-gray-900">Invoice List</h3>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
              <input
                type="text"
                placeholder="Search invoices..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <button
                    onClick={() => handleSort('invoiceNumber')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Invoice Number</span>
                    {sortBy === 'invoiceNumber' && (
                      <span className="text-primary-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th>Customer</th>
                <th>Status</th>
                <th>
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Total</span>
                    {sortBy === 'total' && (
                      <span className="text-primary-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Credits</th>
                <th>
                  <button
                    onClick={() => handleSort('issueDate')}
                    className="flex items-center space-x-1 hover:text-gray-700"
                  >
                    <span>Issue Date</span>
                    {sortBy === 'issueDate' && (
                      <span className="text-primary-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium text-primary-600">
                    {invoice.invoiceNumber}
                  </td>
                  <td>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {invoice.customer?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-gray-500">
                        {invoice.customer?.email || ''}
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
                      : formatCurrency(0)
                    }
                  </td>
                  <td className="text-gray-500">
                    {parseFloat(invoice.creditAmount) > 0 
                      ? `-${formatCurrency(invoice.creditAmount)}`
                      : formatCurrency(0)
                    }
                  </td>
                  <td className="text-gray-500">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="text-gray-500">
                    {formatDate(invoice.dueDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedInvoices.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            {searchTerm || statusFilter !== 'ALL'
              ? 'No invoices found matching your criteria.'
              : 'No invoices found.'}
          </div>
        )}
      </div>
    </div>
  )
}

