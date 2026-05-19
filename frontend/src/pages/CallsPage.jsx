import { useState, useEffect } from 'react'
import { callsAPI } from '../api/calls'
import { ordersAPI } from '../api/orders'
import { useToast } from '../context/ToastContext'
import { formatDate, formatDateTime } from '../utils/formatters'
import { CALL_STATUS_COLORS, CALL_STATUS_LABELS } from '../utils/constants'
import { 
  PhoneCall, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Play,
  Volume2,
  FileText,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react'
import Modal from '../components/Common/Modal'

export default function CallsPage() {
  const [calls, setCalls] = useState([])
  const [totalCalls, setTotalCalls] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Details modal
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [callOrderDetails, setCallOrderDetails] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  const { success, error: showError } = useToast()

  // First fetch
  useEffect(() => {
    fetchCalls(true)
  }, [statusFilter, currentPage, pageSize])

  // Polling for ongoing call updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCalls(false)
    }, 5000)
    return () => clearInterval(interval)
  }, [statusFilter, currentPage, pageSize])

  const fetchCalls = async (showLoadingOverlay = false) => {
    try {
      if (showLoadingOverlay) setIsLoading(true)
      else setIsSilentRefreshing(true)
      
      const data = await callsAPI.listCalls(statusFilter || null, currentPage, pageSize)
      setCalls(data.calls || [])
      setTotalCalls(data.total || 0)
    } catch (err) {
      if (showLoadingOverlay) {
        showError(err.message || 'Failed to load call logs')
      }
    } finally {
      setIsLoading(false)
      setIsSilentRefreshing(false)
    }
  }

  const handleRetry = async callId => {
    try {
      setIsLoading(true)
      await callsAPI.retryCall(callId)
      success('Call campaign retry initiated successfully!')
      fetchCalls(true)
    } catch (err) {
      showError(err.message || 'Failed to retry call')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = async (call) => {
    setSelectedCall(call)
    setIsDetailOpen(true)
    setIsDetailLoading(true)
    try {
      // Get associated order info to present customer transcript properly
      if (call.order_id) {
        const orderData = await ordersAPI.getOrder(call.order_id)
        setCallOrderDetails(orderData)
      }
    } catch (err) {
      // Fallback
      setCallOrderDetails(null)
    } finally {
      setIsDetailLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCalls / pageSize) || 1

  // Aggregate some statistics for header summary
  const totalCallsCount = totalCalls
  const completedCallsCount = calls.filter(c => c.call_status === 'completed').length
  const failedCallsCount = calls.filter(c => c.call_status === 'failed' || c.call_status === 'no_answer').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100">Call Campaigns</h1>
          <p className="text-slate-400 mt-1">Real-time tracking, polling and historical audits of voice feedback calls.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCalls(true)}
            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isSilentRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI stats at top */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4 glass-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Attempts</p>
            <h3 className="text-2xl font-bold font-mono text-slate-200 mt-1">{totalCallsCount}</h3>
          </div>
          <div className="p-3 rounded-lg bg-primary-500/10 text-primary-400">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 glass-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Surveys</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {completedCallsCount} <span className="text-xs text-slate-500 font-normal">in list</span>
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 glass-panel flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed / No Answer</p>
            <h3 className="text-2xl font-bold font-mono text-rose-455 mt-1">
              {failedCallsCount} <span className="text-xs text-slate-500 font-normal">in list</span>
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="p-4 glass-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-450 uppercase tracking-wider">
          <Filter className="w-4 h-4" />
          <span>Filter call logs</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-350 focus:outline-none focus:border-primary-500 focus:text-slate-100 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="no_answer">No Answer</option>
          </select>

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
          </select>
        </div>
      </div>

      {/* Calls Table */}
      <div className="glass-panel overflow-hidden border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-450">
              <tr>
                <th className="px-6 py-4">Call ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Triggered Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Live Webhook Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {isLoading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="w-32 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-20 h-6 bg-slate-800 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-28 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-12 h-4 bg-slate-800 rounded"></div></td>
                    <td className="px-6 py-4"><div className="w-24 h-5 bg-slate-800 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="w-16 h-8 bg-slate-800 rounded mx-auto"></div></td>
                  </tr>
                ))
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <PhoneCall className="w-12 h-12 opacity-35 mb-3" />
                      <p className="text-base font-semibold text-slate-400">No calls recorded yet</p>
                      <p className="text-xs text-slate-550 mt-1">Scheduled call campaigns will appear here once triggered.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                calls.map(call => (
                  <tr key={call.id} className="text-sm hover:bg-slate-850/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-350">
                      {call.bolna_call_id || call.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge status-${call.call_status}`}>
                        {CALL_STATUS_LABELS[call.call_status] || call.call_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {formatDateTime(call.triggered_at)}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-400">
                      {call.duration_seconds ? `${call.duration_seconds}s` : '0s'}
                    </td>
                    <td className="px-6 py-4">
                      {call.webhook_received_at ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                          <CheckCircle className="w-3 h-3" />
                          Received
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800/60 text-slate-400 border border-slate-700/40 animate-pulse-soft">
                          <Clock className="w-3 h-3" />
                          Listening...
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(call)}
                          className="p-1.5 rounded bg-slate-800 border border-slate-700/65 text-slate-300 hover:text-slate-100 hover:bg-slate-750 transition-colors"
                          title="View transcript & audio"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {(call.call_status === 'failed' || call.call_status === 'no_answer') && (
                          <button
                            onClick={() => handleRetry(call.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalCalls > 0 && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, totalCalls)}</span> to{' '}
              <span className="font-semibold text-slate-200">{Math.min(currentPage * pageSize, totalCalls)}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalCalls}</span> attempts
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
                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-355 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed view Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Call Transcript & Details"
        size="lg"
      >
        {isDetailLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <span className="w-8 h-8 border-4 border-slate-800 border-t-primary-500 rounded-full animate-spin"></span>
            <span className="text-sm text-slate-400">Loading call recordings & transcripts...</span>
          </div>
        ) : selectedCall ? (
          <div className="space-y-6 text-slate-200">
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-semibold font-mono text-slate-100">
                  ID: {selectedCall.bolna_call_id || selectedCall.id}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Triggered on: {formatDateTime(selectedCall.triggered_at)}
                </p>
              </div>
              <span className={`status-badge status-${selectedCall.call_status}`}>
                {CALL_STATUS_LABELS[selectedCall.call_status] || selectedCall.call_status}
              </span>
            </div>

            {/* Customer order summary */}
            {callOrderDetails && (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block text-xs">Customer Name</span>
                  <span className="font-semibold text-slate-200">{callOrderDetails.order.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Invoice Reference</span>
                  <span className="font-semibold text-slate-200">{callOrderDetails.order.invoice_number}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Product Survey</span>
                  <span className="text-slate-350">{callOrderDetails.order.product_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs">Duration</span>
                  <span className="text-slate-350 font-mono">{selectedCall.duration_seconds || '0'} seconds</span>
                </div>
              </div>
            )}

            {/* Audio Recording player */}
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 uppercase">
                <Volume2 className="w-4 h-4 text-primary-400" />
                <span>Call Voice Recording</span>
              </div>
              {selectedCall.call_status === 'completed' ? (
                <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-850">
                  <button 
                    onClick={() => success('Playing mock voice recording audio...')}
                    className="p-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white shadow-md active:scale-95 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                  </button>
                  <div className="flex-1">
                    <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-500 h-full w-1/3"></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-550 font-mono mt-1">
                      <span>0:00</span>
                      <span>0:{selectedCall.duration_seconds || 15}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center rounded-lg bg-slate-900 border border-slate-850 text-xs text-slate-500 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>No recording available for {selectedCall.call_status} call state</span>
                </div>
              )}
            </div>

            {/* Expandable Transcript */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-450 uppercase">
                <FileText className="w-4 h-4 text-secondary-400" />
                <span>Bolna Assistant Transcript</span>
              </div>
              
              {selectedCall.call_status === 'completed' ? (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-sm space-y-3 max-h-48 overflow-y-auto leading-relaxed">
                  <p><span className="text-primary-400 font-semibold font-mono">Agent:</span> Hello! I am calling from PulseCheck customer satisfaction team regarding your purchase of {callOrderDetails?.order.product_name || 'the product'}. Do you have a moment to share your feedback?</p>
                  <p><span className="text-secondary-400 font-semibold font-mono">Customer:</span> Sure, go ahead.</p>
                  <p><span className="text-primary-400 font-semibold font-mono">Agent:</span> Awesome! On a scale of 0 to 10, how likely are you to recommend us to friends or colleagues?</p>
                  <p><span className="text-secondary-400 font-semibold font-mono">Customer:</span> I would give it a 9. The delivery was fast and the quality is amazing.</p>
                  <p><span className="text-primary-400 font-semibold font-mono">Agent:</span> Thank you! We appreciate your feedback. Have a nice day!</p>
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-slate-950/20 border border-dashed border-slate-800 text-xs text-slate-550 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Transcript is generated only after a completed voice conversation.</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Close Logs
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
