import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { analyticsAPI } from '../api/analytics'
import { useToast } from '../context/ToastContext'
import { formatCurrency } from '../utils/formatters'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  HelpCircle,
  Activity,
  Smile,
  ShieldCheck,
  PackageCheck
} from 'lucide-react'

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [npsData, setNpsData] = useState([])
  const [sentimentData, setSentimentData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { error: showError } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const summaryData = await analyticsAPI.getSummary()
      setSummary(summaryData)

      const npsData = await analyticsAPI.getNPSTrend()
      setNpsData(npsData)

      const sentimentData = await analyticsAPI.getSentimentByProduct()
      setSentimentData(sentimentData)
    } catch (err) {
      showError(err.message || 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  // Modern Chart Colors matching brand identity
  const SENTIMENT_COLORS = {
    positive: '#10b981', // green
    neutral: '#f59e0b',  // amber
    negative: '#ef4444'  // rose
  }

  const PIE_COLORS = [
    SENTIMENT_COLORS.positive,
    SENTIMENT_COLORS.neutral,
    SENTIMENT_COLORS.negative
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-900/60 rounded-lg animate-pulse w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse"></div>
          <div className="h-80 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse"></div>
        </div>
      </div>
    )
  }

  const sentimentPieData = summary ? [
    { name: 'Positive', value: summary.sentiment_distribution?.positive || 0 },
    { name: 'Neutral', value: summary.sentiment_distribution?.neutral || 0 },
    { name: 'Negative', value: summary.sentiment_distribution?.negative || 0 }
  ].filter(i => i.value > 0) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary-400" />
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-1">Audit customer sentiment metrics, NPS distribution, and feedback reports.</p>
        </div>

        {/* Date Filter Selection UI */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-slate-450" />
          <span>Last 30 Days</span>
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 glass-panel border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Feedback Loop</p>
              <p className="text-2xl font-bold font-mono text-slate-100 mt-1">{summary.total_orders}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 glass-panel border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voice Survey Completed</p>
              <p className="text-2xl font-bold font-mono text-emerald-450 mt-1">{summary.calls_completed}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-450">
              <Smile className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 glass-panel border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Review Audits</p>
              <p className="text-2xl font-bold font-mono text-amber-450 mt-1">{summary.pending_manual_reviews}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-450">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 glass-panel border-slate-800/80 shadow-md flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Customer Loyalty</p>
              <p className="text-2xl font-bold font-mono text-primary-450 mt-1">
                {summary.avg_nps_score ? summary.avg_nps_score.toFixed(1) : 'N/A'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-450">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* NPS Trend */}
        <div className="p-6 glass-panel border-slate-800">
          <h3 className="text-base font-bold font-poppins text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-primary-400" />
            NPS Historical Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={npsData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  domain={[0, 10]} 
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'semibold', fontSize: '12px' }}
                  itemStyle={{ color: '#3b82f6', fontSize: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_nps" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ r: 4, stroke: '#2563eb', strokeWidth: 1, fill: '#0f172a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="p-6 glass-panel border-slate-800">
          <h3 className="text-base font-bold font-poppins text-slate-200 mb-4 flex items-center gap-2">
            <Smile className="w-4.5 h-4.5 text-secondary-400" />
            Feedback Sentiment Distribution
          </h3>
          <div className="h-72 flex items-center justify-center">
            {sentimentPieData.length === 0 ? (
              <div className="text-slate-500 text-xs">No completed feedback data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={40}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sentimentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    height={36} 
                    formatter={(value) => <span className="text-xs text-slate-400 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Product Sentiment bar charts */}
      {sentimentData && sentimentData.length > 0 && (
        <div className="p-6 glass-panel border-slate-800">
          <h3 className="text-base font-bold font-poppins text-slate-200 mb-4 flex items-center gap-2">
            <PackageCheck className="w-4.5 h-4.5 text-emerald-400" />
            Customer Sentiment Breakdown by Product Category
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="product_name" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  iconType="rect"
                  formatter={(value) => <span className="text-xs text-slate-450 font-medium capitalize">{value}</span>}
                />
                <Bar dataKey="positive" name="positive" fill={SENTIMENT_COLORS.positive} radius={[4, 4, 0, 0]} />
                <Bar dataKey="neutral" name="neutral" fill={SENTIMENT_COLORS.neutral} radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" name="negative" fill={SENTIMENT_COLORS.negative} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
