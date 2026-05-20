import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { feedbackAPI } from '../api/feedback'
import { analyticsAPI } from '../api/analytics'
import { useToast } from '../context/ToastContext'
import Modal from '../components/common/Modal'
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Calendar, 
  Smile, 
  Frown, 
  Meh, 
  Sparkles, 
  User, 
  Phone, 
  FileText, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Tag,
  AlertCircle
} from 'lucide-react'

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalFeedbacks, setTotalFeedbacks] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  
  // Search & Filters
  const [search, setSearch] = useState('')
  const [sentimentFilter, setSentimentFilter] = useState('')
  const [npsCategoryFilter, setNpsCategoryFilter] = useState('')
  
  // Detail Modal
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)
  const [feedbackDetail, setFeedbackDetail] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { error: showError } = useToast()

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchFeedbacks()
  }, [page, sentimentFilter, npsCategoryFilter])

  const fetchStats = async () => {
    try {
      setIsStatsLoading(true)
      const data = await analyticsAPI.getSummary()
      setSummary(data)
    } catch (err) {
      console.error('Failed to load summary stats', err)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const data = await feedbackAPI.getFeedbacks(
        sentimentFilter,
        npsCategoryFilter,
        search,
        page,
        pageSize
      )
      setFeedbacks(data.feedbacks || [])
      setTotalFeedbacks(data.total || 0)
    } catch (err) {
      showError(err.message || 'Failed to load feedbacks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchFeedbacks()
  }

  const handleClearFilters = () => {
    setSearch('')
    setSentimentFilter('')
    setNpsCategoryFilter('')
    setPage(1)
    // Needs immediate call since state updates are batch
    setTimeout(() => {
      fetchFeedbacks()
    }, 0)
  }

  const handleViewDetail = async (id) => {
    try {
      setSelectedFeedbackId(id)
      setIsDetailLoading(true)
      setIsModalOpen(true)
      const detail = await feedbackAPI.getFeedbackDetail(id)
      setFeedbackDetail(detail)
    } catch (err) {
      showError(err.message || 'Failed to load feedback details')
      setIsModalOpen(false)
    } finally {
      setIsDetailLoading(false)
    }
  }

  // NPS Category Colors
  const getNpsCategoryColor = (category) => {
    if (!category) return 'text-slate-400'
    const cat = category.toLowerCase()
    if (cat === 'promoter') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (cat === 'detractor') return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  }

  // Sentiment Icons & Colors
  const getSentimentDetails = (sentiment) => {
    if (!sentiment) return { label: 'Neutral', color: 'text-slate-400 bg-slate-800 border-slate-700', icon: Meh }
    const s = sentiment.toLowerCase()
    if (s === 'positive') return { label: 'Positive', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: Smile }
    if (s === 'negative') return { label: 'Negative', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', icon: Frown }
    return { label: 'Neutral', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Meh }
  }

  // Recharts Chart Colors
  const COLORS = {
    promoter: '#10b981',
    passive: '#f59e0b',
    detractor: '#ef4444',
    positive: '#10b981',
    neutral: '#f59e0b',
    negative: '#ef4444',
    accent: '#3b82f6'
  }

  // Prepare chart data
  const npsCategoryChartData = summary ? [
    { name: 'Promoters', count: summary.nps_category_breakdown?.promoter || 0, color: COLORS.promoter },
    { name: 'Passives', count: summary.nps_category_breakdown?.passive || 0, color: COLORS.passive },
    { name: 'Detractors', count: summary.nps_category_breakdown?.detractor || 0, color: COLORS.detractor }
  ] : []

  const npsScoresChartData = summary ? Array.from({ length: 10 }, (_, i) => {
    const score = i + 1
    return {
      score: `${score}`,
      count: summary.nps_scores_breakdown?.[`${score}`] || 0
    }
  }) : []

  const sentimentChartData = summary ? [
    { name: 'Positive', count: summary.sentiment_breakdown?.positive || 0, color: COLORS.positive },
    { name: 'Neutral', count: summary.sentiment_breakdown?.neutral || 0, color: COLORS.neutral },
    { name: 'Negative', count: summary.sentiment_breakdown?.negative || 0, color: COLORS.negative }
  ] : []

  const totalPages = Math.ceil(totalFeedbacks / pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary-400" />
            Customer Feedbacks
          </h1>
          <p className="text-slate-400 mt-1">Audit detailed transcripts, NPS breakdowns, and product ratings from campaigns.</p>
        </div>
        
        <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-350 text-xs font-semibold uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-slate-450" />
          <span>All Campaigns</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      {!isStatsLoading && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NPS Score Distribution (BarChart) */}
          <div className="p-5 glass-panel border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-poppins text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                NPS Rating Distribution
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Scores 1 - 10</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={npsScoresChartData} margin={{ left: -25, right: 0, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="score" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3b82f6', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill={COLORS.accent} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* NPS Category breakdown (BarChart) */}
          <div className="p-5 glass-panel border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-poppins text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                NPS Category Distribution
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Loyalty Segments</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={npsCategoryChartData} margin={{ left: -25, right: 0, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {npsCategoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sentiment distribution (BarChart) */}
          <div className="p-5 glass-panel border-slate-800/80 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-poppins text-slate-200 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-amber-400" />
                Overall Sentiment Summary
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Voice Sentiment</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sentimentChartData} margin={{ left: -25, right: 0, top: 10, bottom: 0 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '11px' }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="glass-panel p-4 border-slate-800 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by customer name, invoice number, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg text-sm text-slate-200 placeholder-slate-600 outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* NPS category filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={npsCategoryFilter}
                onChange={(e) => {
                  setNpsCategoryFilter(e.target.value)
                  setPage(1)
                }}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none focus:border-primary-500 transition-all"
              >
                <option value="">All NPS Segments</option>
                <option value="promoter">Promoters</option>
                <option value="passive">Passives</option>
                <option value="detractor">Detractors</option>
              </select>
            </div>

            {/* Sentiment filter */}
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value)
                setPage(1)
              }}
              className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 outline-none focus:border-primary-500 transition-all"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>

            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
            >
              Reset
            </button>
            
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold rounded-lg transition-all"
            >
              Apply Search
            </button>
          </div>
        </form>
      </div>

      {/* Feedback Logs List */}
      <div className="space-y-4">
        <h2 className="text-md font-bold font-poppins text-slate-200 flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-400" />
          Recent Customer Feedbacks ({totalFeedbacks})
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 glass-panel animate-pulse h-36 border-slate-800"></div>
            ))}
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="glass-panel p-16 text-center text-slate-500 border-slate-805">
            <AlertCircle className="w-12 h-12 mx-auto opacity-30 mb-3" />
            <p className="text-base font-semibold text-slate-400">No feedbacks found</p>
            <p className="text-xs text-slate-550 mt-1">Try clearing filters or checking if outbound call logs have feedback.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {feedbacks.map((f) => {
              const sentiment = getSentimentDetails(f.overall_sentiment)
              const SentimentIcon = sentiment.icon
              return (
                <div
                  key={f.id}
                  onClick={() => handleViewDetail(f.id)}
                  className="p-5 glass-panel border-slate-800/80 hover:bg-slate-900/20 hover:border-slate-700/80 transition-all duration-200 cursor-pointer flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-500" />
                        {f.customer_name}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">Invoice: {f.invoice_number}</span>
                      <span className="text-xs text-slate-600">•</span>
                      <span className="text-xs text-slate-400 font-medium">{f.product_name}</span>
                    </div>

                    {/* Primary Feedback Snippet */}
                    <p className="text-xs text-slate-350 leading-relaxed line-clamp-2">
                      "{f.primary_feedback || 'No verbatim feedback extracted yet.'}"
                    </p>

                    {/* Highlights & Issues */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {f.positive_highlight && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/20 text-emerald-300 border border-emerald-800/20 truncate max-w-xs">
                          ✨ {f.positive_highlight}
                        </span>
                      )}
                      {f.issue_raised && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-955/20 text-rose-300 border border-rose-900/30 truncate max-w-xs">
                          ⚠️ {f.issue_raised}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* NPS & Sentiment Badges */}
                  <div className="flex items-center md:flex-col md:items-end gap-3 justify-between md:justify-start md:text-right shrink-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">NPS Score</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded ${getNpsCategoryColor(f.nps_category)}`}>
                          {f.nps_score !== null ? f.nps_score : 'N/A'}/10
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-550 capitalize font-medium">{f.nps_category}</div>
                    </div>

                    <span className={`status-badge flex items-center gap-1.5 ${sentiment.color} text-xs font-semibold px-2.5 py-1`}>
                      <SentimentIcon className="w-3.5 h-3.5" />
                      {sentiment.label}
                    </span>

                    <span className="text-[10px] text-slate-600 font-medium font-mono hidden md:block">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-900">
            <span className="text-xs text-slate-500 font-semibold">
              Showing Page <span className="text-slate-350">{page}</span> of <span className="text-slate-350">{totalPages}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 disabled:opacity-40 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback & Order & Calls Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Full Customer Feedback audit"
        size="xl"
      >
        {isDetailLoading || !feedbackDetail ? (
          <div className="space-y-4 py-8 text-center text-slate-500">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-xs">Fetching feedback records, call campaigns, and invoice details...</p>
          </div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            {/* Grid details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-400 flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  Order & Customer Data
                </h3>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between pb-2 border-b border-slate-850">
                    <span className="text-slate-450">Customer Name</span>
                    <span className="text-slate-200 font-semibold">{feedbackDetail.order?.customer_name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-850">
                    <span className="text-slate-450">Contact Phone</span>
                    <span className="text-slate-200 font-mono font-medium">{feedbackDetail.order?.customer_phone}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-850">
                    <span className="text-slate-450">Invoice Number</span>
                    <span className="text-slate-200 font-mono font-bold text-primary-450">{feedbackDetail.order?.invoice_number}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-850">
                    <span className="text-slate-450">Product Catalog</span>
                    <span className="text-slate-200 font-semibold">{feedbackDetail.order?.product_name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-850">
                    <span className="text-slate-450">Purchase Amount</span>
                    <span className="text-slate-200 font-mono font-semibold">${feedbackDetail.order?.amount_paid?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Quantity</span>
                    <span className="text-slate-200 font-mono font-semibold">{feedbackDetail.order?.purchase_qty || 1}</span>
                  </div>
                </div>
              </div>

              {/* Feedback Summary Cards */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Loyalty & Sentiment Audit
                </h3>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">NPS SCORE</span>
                      <span className={`text-lg font-black ${getNpsCategoryColor(feedbackDetail.feedback?.nps_category)}`}>
                        {feedbackDetail.feedback?.nps_score || 'N/A'}/10
                      </span>
                      <span className="text-[9px] text-slate-400 block capitalize mt-0.5 font-medium">({feedbackDetail.feedback?.nps_category})</span>
                    </div>
                    <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">SENTIMENT</span>
                      <span className={`text-sm font-bold flex items-center gap-1 capitalize ${getSentimentDetails(feedbackDetail.feedback?.overall_sentiment).color}`}>
                        {feedbackDetail.feedback?.overall_sentiment}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {feedbackDetail.feedback?.positive_highlight && (
                      <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-900/20">
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">Positive highlight</span>
                        <p className="text-slate-300 leading-relaxed">{feedbackDetail.feedback.positive_highlight}</p>
                      </div>
                    )}
                    {feedbackDetail.feedback?.issue_raised && (
                      <div className="p-2.5 rounded bg-rose-955/20 border border-rose-900/20">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider block mb-0.5">Critical Issue Raised</span>
                        <p className="text-slate-300 leading-relaxed">{feedbackDetail.feedback.issue_raised}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verbatim quotes */}
            {feedbackDetail.feedback?.verbatim_quote && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/85 relative">
                <span className="absolute -top-2.5 left-4 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[9px] font-bold text-primary-400 uppercase tracking-wider">
                  Verbatim Customer Quote
                </span>
                <p className="text-xs text-slate-200 italic leading-relaxed pt-1.5">
                  "{feedbackDetail.feedback.verbatim_quote}"
                </p>
              </div>
            )}

            {/* Call Logs & Transcripts Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-450 flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                Outbound Calls Campaigns
              </h3>

              {feedbackDetail.call_logs?.length === 0 ? (
                <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-6 text-center text-slate-500 text-xs">
                  No campaigns log attempts found.
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackDetail.call_logs.map((log, index) => (
                    <div key={log.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4.5 space-y-4">
                      {/* Meta header */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-850 pb-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded font-mono font-medium">
                            Attempt #{feedbackDetail.call_logs.length - index}
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">ID: {log.bolna_call_id}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">
                            Duration: {log.duration_seconds ? `${log.duration_seconds.toFixed(0)}s` : 'N/A'}
                          </span>
                          <span className={`status-badge text-[10px] font-semibold ${
                            log.call_status === 'completed' 
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40' 
                              : 'bg-rose-950/40 text-rose-300 border-rose-800/40'
                          }`}>
                            {log.call_status}
                          </span>
                        </div>
                      </div>

                      {/* Summary */}
                      {log.summary && (
                        <div className="text-xs">
                          <span className="font-bold text-slate-400 block mb-1">Call Summary Assessment:</span>
                          <p className="text-slate-300 bg-slate-950/30 border border-slate-850 p-3 rounded-lg leading-relaxed">
                            {log.summary}
                          </p>
                        </div>
                      )}

                      {/* Transcripts */}
                      {log.transcript && (
                        <div className="text-xs space-y-2">
                          <span className="font-bold text-slate-400 block">Conversation Transcript:</span>
                          <div className="max-h-48 overflow-y-auto bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 font-sans leading-relaxed">
                            {log.transcript.split('\n').map((line, lIdx) => {
                              const isAgent = line.toLowerCase().startsWith('ai:') || line.toLowerCase().startsWith('agent:')
                              const isUser = line.toLowerCase().startsWith('user:') || line.toLowerCase().startsWith('customer:')
                              
                              let name = 'Participant'
                              let text = line
                              
                              if (line.includes(':')) {
                                const parts = line.split(':')
                                name = parts[0]
                                text = parts.slice(1).join(':')
                              }

                              return (
                                <div key={lIdx} className={`flex flex-col space-y-0.5 ${isAgent ? 'items-start' : isUser ? 'items-end' : 'items-start'}`}>
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                                    {name}
                                  </span>
                                  <div className={`p-2.5 rounded-lg max-w-sm ${
                                    isAgent 
                                      ? 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/50' 
                                      : isUser 
                                        ? 'bg-primary-950/40 text-primary-200 rounded-tr-none border border-primary-900/30' 
                                        : 'bg-slate-900 text-slate-350'
                                  }`}>
                                    {text.trim()}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Modal footer close */}
            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg shadow-md active:scale-95 transition-all text-xs"
              >
                Close details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
