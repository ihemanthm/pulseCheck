import { useState, useEffect, useRef } from 'react'
import { ordersAPI } from '../api/orders'
import { callsAPI } from '../api/calls'
import { useToast } from '../context/ToastContext'
import { formatDate, formatCurrency } from '../utils/formatters'
import { CALL_STATUS_COLORS, CALL_STATUS_LABELS } from '../utils/constants'
import { 
  Search, 
  Filter, 
  PhoneCall, 
  Eye, 
  CheckSquare, 
  Square,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  User,
  ShoppingBag
} from 'lucide-react'
import Modal from '../components/common/Modal'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [totalOrders, setTotalOrders] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState(new Set())
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  
  // Detail Modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const { success, error: showError } = useToast()

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset page on search
    }, 4000)
    return () => clearTimeout(handler)
  }, [searchQuery])

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, debouncedSearch, currentPage, pageSize])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const data = await ordersAPI.listOrders(
        statusFilter || null,
        debouncedSearch || null,
        currentPage,
        pageSize
      )
      setOrders(data.orders || [])
      setTotalOrders(data.total || 0)
    } catch (err) {
      showError(err.message || 'Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTriggerCalls = async () => {
    if (selectedOrders.size === 0) {
      showError('Please select orders to trigger calls')
      return
    }

    try {
      setIsLoading(true)
      const orderIds = Array.from(selectedOrders)
      const response = await callsAPI.triggerCalls(orderIds)
      
      const triggeredCount = response.triggered?.length || 0
      const skippedCount = response.skipped?.length || 0
      const failedCount = response.failed?.length || 0

      if (triggeredCount > 0) {
        success(`Successfully scheduled ${triggeredCount} outbound calls!`)
      }
      if (skippedCount > 0 || failedCount > 0) {
        showError(`Notice: ${skippedCount} skipped (duplicate guard), ${failedCount} failed to queue.`)
      }

      setSelectedOrders(new Set())
      fetchOrders()
    } catch (err) {
      showError(err.message || 'Failed to trigger outbound campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTriggerSingleCall = async (orderId) => {
    try {
      setIsLoading(true)
      const response = await callsAPI.triggerCalls([orderId])
      if (response.triggered?.length > 0) {
        success('Outbound call successfully scheduled!')
      } else if (response.skipped?.length > 0) {
        showError('Call skipped: Active call already exists for this order.')
      } else {
        showError('Failed to schedule call.')
      }
      fetchOrders()
    } catch (err) {
      showError(err.message || 'Failed to trigger outbound call')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = async (orderId) => {
    try {
      setIsDetailLoading(true)
      setIsDetailOpen(true)
      const data = await ordersAPI.getOrder(orderId)
      setSelectedOrderDetail(data)
    } catch (err) {
      showError(err.message || 'Failed to load order details')
      setIsDetailOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const toggleOrderSelection = orderId => {
    const newSet = new Set(selectedOrders)
    if (newSet.has(orderId)) {
      newSet.delete(orderId)
    } else {
      newSet.add(orderId)
    }
    setSelectedOrders(newSet)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const pendingIds = orders.map(o => o.id)
      setSelectedOrders(new Set(pendingIds))
    } else {
      setSelectedOrders(new Set())
    }
  }

  // Calculate pagination variables
  const totalPages = Math.ceil(totalOrders / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100">Orders</h1>
          <p className="text-slate-400 mt-1">Manage and audit uploaded customer records and run outbound voice campaigns.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleTriggerCalls}
            disabled={selectedOrders.size === 0 || isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <PhoneCall className="w-4 h-4" />
            Trigger Outbound Calls ({selectedOrders.size})
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 glass-panel flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice, customer name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all duration-200"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-450 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-450 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-350 focus:outline-none focus:border-primary-500 focus:text-slate-100 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          {/* Page Size options */}
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-355 focus:outline-none focus:border-primary-500 focus:text-slate-100 transition-colors"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="glass-panel overflow-hidden border-slate-800 shadow-xl">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-450 z-10">
              <tr>
                <th className="px-6 py-4 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-800 text-primary-600 bg-slate-950/55 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      checked={orders.length > 0 && selectedOrders.size === orders.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </div>
                </th>
                <th className="px-6 py-4">Invoice Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Call Status</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 bg-slate-900/10">
              {isLoading ? (
                // Skeleton loading rows
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-28 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-36 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-800 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-8 bg-slate-800 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet className="w-12 h-12 opacity-35 mb-3 text-slate-400" />
                      <p className="text-base font-semibold text-slate-400">No orders matching criteria</p>
                      <p className="text-xs text-slate-550 mt-1 max-w-md">Try adjusting your filters, searching different keywords, or uploading a CSV template.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const isSelected = selectedOrders.has(order.id)
                  return (
                    <tr 
                      key={order.id} 
                      className={`
                        text-sm transition-all duration-150 hover:bg-slate-850/30
                        ${isSelected ? 'bg-primary-950/5' : ''}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-slate-800 text-primary-600 bg-slate-950/55 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleOrderSelection(order.id)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-200">{order.invoice_number}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-300">{order.customer_name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            {/* Mask phone for privacy: show first 3 and last 3 */}
                            {order.customer_phone ? `${order.customer_phone.substring(0, 5)}***${order.customer_phone.slice(-3)}` : 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate" title={order.product_name}>
                        {order.product_name}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-200">
                        {formatCurrency(order.amount_paid)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`status-badge status-${order.call_status}`}>
                          {CALL_STATUS_LABELS[order.call_status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-450 text-xs">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(order.id)}
                            className="p-1.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 hover:bg-slate-750 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleTriggerSingleCall(order.id)}
                            disabled={order.call_status === 'scheduled' || order.call_status === 'completed'}
                            className="p-1.5 rounded bg-primary-600/10 border border-primary-500/20 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                            title="Trigger outbound call"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalOrders > 0 && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, totalOrders)}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, totalOrders)}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalOrders}</span> orders
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoading}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-350 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="px-3 py-1.5 rounded bg-slate-950 font-mono text-slate-200 font-semibold border border-slate-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || isLoading}
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-350 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Order Detailed View"
        size="lg"
      >
        {isDetailLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <span className="w-8 h-8 border-4 border-slate-800 border-t-primary-500 rounded-full animate-spin"></span>
            <span className="text-sm text-slate-400">Fetching detailed record...</span>
          </div>
        ) : selectedOrderDetail ? (
          <div className="space-y-6 text-slate-200">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-lg font-bold font-poppins text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary-400" />
                  {selectedOrderDetail.order.invoice_number}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">ID: {selectedOrderDetail.order.id}</p>
              </div>
              <span className={`status-badge status-${selectedOrderDetail.order.call_status}`}>
                {CALL_STATUS_LABELS[selectedOrderDetail.order.call_status]}
              </span>
            </div>

            {/* Grid customer details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase mb-2">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Details</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-slate-500">Name:</span> {selectedOrderDetail.order.customer_name}</p>
                  <p><span className="text-slate-500">Phone:</span> {selectedOrderDetail.order.customer_phone || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase mb-2">
                  <Building className="w-3.5 h-3.5" />
                  <span>Purchase Info</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-slate-500">Product:</span> {selectedOrderDetail.order.product_name}</p>
                  <p><span className="text-slate-500">SKU:</span> {selectedOrderDetail.order.sku || 'N/A'}</p>
                  <p><span className="text-slate-500">Paid:</span> {formatCurrency(selectedOrderDetail.order.amount_paid)}</p>
                  <p><span className="text-slate-500">Qty:</span> {selectedOrderDetail.order.purchase_qty || 1}</p>
                  <p><span className="text-slate-500">Mode:</span> {selectedOrderDetail.order.purchase_mode || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Extra Metadata Fields if present */}
            {selectedOrderDetail.order.extra_fields && Object.keys(selectedOrderDetail.order.extra_fields).length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Custom CSV Metadata</p>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-350">
                  {Object.entries(selectedOrderDetail.order.extra_fields).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-850 pb-1.5">
                      <span className="capitalize text-slate-500">{key.replace('_', ' ')}:</span>
                      <span className="text-slate-300">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Logs section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase">Call Campaign Log</p>
              {selectedOrderDetail.call_logs?.length === 0 ? (
                <div className="p-4 text-center rounded-xl bg-slate-950/20 border border-dashed border-slate-800 text-xs text-slate-550 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>No outbound call attempts recorded yet for this order</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrderDetail.call_logs.map(log => (
                    <div key={log.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-850 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-slate-200">Call ID: {log.bolna_call_id}</p>
                        <p className="text-slate-500 mt-0.5">Attempted: {formatDate(log.triggered_at)}</p>
                      </div>
                      <span className={`status-badge status-${log.call_status}`}>
                        {CALL_STATUS_LABELS[log.call_status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close action */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500">Failed to load order.</div>
        )}
      </Modal>
    </div>
  )
}
