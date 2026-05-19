import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/analytics'
import { ordersAPI } from '../api/orders'
import { callsAPI } from '../api/calls'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../hooks'
import { 
  PhoneCall, 
  TrendingUp, 
  Clock, 
  Users, 
  UploadCloud, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Activity, 
  Volume2, 
  FileText,
  AlertCircle,
  ClipboardList
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CALL_STATUS_COLORS, CALL_STATUS_LABELS } from '../utils/constants'

export default function DashboardPage() {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [recentCalls, setRecentCalls] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true)
        const summaryData = await analyticsAPI.getSummary()
        setSummary(summaryData)

        const ordersData = await ordersAPI.listOrders(null, null, 1, 5)
        setRecentOrders(ordersData?.orders || [])

        const callsData = await callsAPI.listCalls(null, 1, 5)
        setRecentCalls(callsData?.calls || [])
      } catch (err) {
        showError(err.message || 'Failed to load dashboard statistics')
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [showError])

  // Custom colors for Donut Chart
  const DONUT_COLORS = {
    completed: '#10b981', // green
    in_progress: '#8b5cf6', // purple
    failed: '#ef4444', // red
    pending: '#64748b' // slate
  }

  const getDonutData = () => {
    if (!summary) return []
    // Since Bolna has status completion, we'll map statuses
    return [
      { name: 'Completed', value: summary.calls_completed || 0, color: DONUT_COLORS.completed },
      { name: 'Manual Reviews', value: summary.pending_manual_reviews || 0, color: DONUT_COLORS.in_progress },
      { name: 'Pending Calls', value: (summary.total_orders - summary.calls_completed - summary.pending_manual_reviews) || 0, color: DONUT_COLORS.pending }
    ].filter(item => item.value > 0)
  }

  const donutData = getDonutData()

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Header Skeleton */}
        <div className="h-12 bg-slate-900/60 rounded-xl animate-pulse w-1/3"></div>
        {/* Loading Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-900/60 rounded-xl border border-slate-800/80 animate-pulse"></div>
          ))}
        </div>
        {/* Loading Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900/60 rounded-xl border border-slate-800/80 animate-pulse"></div>
          <div className="h-96 bg-slate-900/60 rounded-xl border border-slate-800/80 animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-panel metric-card-glow-blue">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100">
              Welcome back, {user?.full_name || user?.username}!
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-500/10 border border-primary-500/30 text-primary-400">
              {user?.role}
            </span>
          </div>
          <p className="text-slate-400 mt-1">Here is a real-time summary of your outbound feedback campaigns.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {user?.role !== 'reviewer' && (
            <Link 
              to="/upload" 
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-500 hover:to-secondary-400 text-white shadow-lg hover:shadow-primary-500/20 active:scale-95 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Orders
            </Link>
          )}
          <Link 
            to="/orders" 
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-colors"
          >
            Trigger Calls
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 glass-panel glass-panel-hover metric-card-glow-blue">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Calls Managed</span>
            <span className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-400">
              <PhoneCall className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{summary?.total_orders || 0}</span>
            <span className="text-xs text-emerald-400 flex items-center font-semibold">
              +12.4% <TrendingUp className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">outbound voice calls</p>
        </div>

        <div className="p-6 glass-panel glass-panel-hover metric-card-glow-purple">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calls Completed</span>
            <span className="p-2 rounded-lg bg-secondary-500/10 border border-secondary-500/20 text-secondary-400">
              <Volume2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{summary?.calls_completed || 0}</span>
            <span className="text-xs text-slate-400 font-medium">
              {summary?.total_orders ? ((summary.calls_completed / summary.total_orders) * 100).toFixed(0) : 0}% success rate
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">successful interviews</p>
        </div>

        <div className="p-6 glass-panel glass-panel-hover metric-card-glow-green">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg NPS Score</span>
            <span className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {summary?.avg_nps_score ? summary.avg_nps_score.toFixed(1) : 'N/A'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
              High
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">customer loyalty score</p>
        </div>

        <div className="p-6 glass-panel glass-panel-hover metric-card-glow-amber">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Reviews</span>
            <span className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-100">{summary?.pending_manual_reviews || 0}</span>
            {summary?.pending_manual_reviews > 0 && (
              <span className="text-xs text-amber-400 font-semibold animate-pulse">
                Action Required
              </span>
            )}
          </div>
          <p className="text-slate-500 text-xs mt-1">feedbacks in queue</p>
        </div>
      </div>

      {/* Main content split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Recent Actions & Activities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Action Panel */}
          <div className="p-6 glass-panel">
            <h3 className="text-base font-bold font-poppins text-slate-200 mb-4">Quick Operations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link 
                to="/orders" 
                className="flex items-center p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all group"
              >
                <div className="p-3 rounded-lg bg-primary-500/10 text-primary-400 group-hover:bg-primary-500/20 transition-colors">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-slate-200">View All Orders</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Filter, search, or trigger outbound calls.</p>
                </div>
              </Link>

              <Link 
                to="/calls" 
                className="flex items-center p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all group"
              >
                <div className="p-3 rounded-lg bg-secondary-500/10 text-secondary-400 group-hover:bg-secondary-500/20 transition-colors">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-slate-200">Call Log History</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Check ongoing calls and outcome stats.</p>
                </div>
              </Link>

              <Link 
                to="/analytics" 
                className="flex items-center p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all group"
              >
                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-slate-200">Analytics Panel</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Deeper visual insights into customer sentiment.</p>
                </div>
              </Link>

              <Link 
                to="/review" 
                className="flex items-center p-4 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700/80 transition-all group"
              >
                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="ml-4">
                  <h4 className="text-sm font-semibold text-slate-200">Review Feedback</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Read transcripts & approve resolved calls.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="p-6 glass-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold font-poppins text-slate-200">Recently Added Orders</h3>
              <Link to="/orders" className="text-xs text-primary-400 hover:underline">View All</Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileSpreadsheet className="w-8 h-8 mx-auto opacity-55 mb-2" />
                <p className="text-sm">No orders loaded yet</p>
                <Link to="/upload" className="text-xs text-primary-400 mt-1 hover:underline">Upload a CSV</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                      <th className="py-2.5">Invoice</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5">Paid</th>
                      <th className="py-2.5">Call Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {recentOrders.map(order => (
                      <tr key={order.id} className="text-xs text-slate-300 hover:bg-slate-850/30 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">{order.invoice_number}</td>
                        <td className="py-3">{order.customer_name}</td>
                        <td className="py-3 text-slate-400 max-w-[120px] truncate">{order.product_name}</td>
                        <td className="py-3 font-mono">{formatCurrency(order.amount_paid)}</td>
                        <td className="py-3">
                          <span className={`status-badge status-${order.call_status}`}>
                            {CALL_STATUS_LABELS[order.call_status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Status Pie Chart & Call campaigns */}
        <div className="space-y-6">
          
          {/* Call outcomes Pie Chart */}
          <div className="p-6 glass-panel flex flex-col h-fit">
            <h3 className="text-base font-bold font-poppins text-slate-200 mb-2">Campaign Distribution</h3>
            <p className="text-xs text-slate-500 mb-6">Call completion breakdown across all records.</p>
            
            {donutData.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Activity className="w-8 h-8 mx-auto opacity-55 mb-2" />
                <p className="text-sm">Awaiting campaign logs...</p>
              </div>
            ) : (
              <div className="h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value) => <span className="text-xs text-slate-400 font-medium">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Recent Outbound Calls Log status */}
          <div className="p-6 glass-panel">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold font-poppins text-slate-200">Recent Call Logs</h3>
              <Link to="/calls" className="text-xs text-primary-400 hover:underline">View Logs</Link>
            </div>

            {recentCalls.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <PhoneCall className="w-8 h-8 mx-auto opacity-55 mb-2" />
                <p className="text-sm">No outbound call logs recorded</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentCalls.map(call => (
                  <div key={call.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/30 border border-slate-850 hover:border-slate-800 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-slate-800 ${call.call_status === 'completed' ? 'text-emerald-400' : 'text-slate-400'}`}>
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">Call ID: {call.bolna_call_id?.substring(0, 8)}...</p>
                        <p className="text-[10px] text-slate-500">Triggered: {formatDate(call.triggered_at)}</p>
                      </div>
                    </div>
                    <span className={`status-badge status-${call.call_status}`}>
                      {CALL_STATUS_LABELS[call.call_status] || call.call_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
