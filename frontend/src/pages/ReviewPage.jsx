import { useState, useEffect } from 'react'
import { feedbackAPI } from '../api/feedback'
import { useToast } from '../context/ToastContext'
import { PRIORITY_COLORS, PRIORITY_LABELS, REVIEW_STATUS_LABELS } from '../utils/constants'
import { 
  ShieldCheck, 
  MessageSquare, 
  User, 
  Tag, 
  AlertTriangle,
  Heart,
  MessageCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ClipboardList
} from 'lucide-react'

export default function ReviewPage() {
  const [feedback, setFeedback] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const { success, error: showError } = useToast()

  useEffect(() => {
    fetchPendingReviews()
  }, [])

  const fetchPendingReviews = async () => {
    try {
      setIsLoading(true)
      const data = await feedbackAPI.getPendingReviews(1, 50)
      setFeedback(data.feedback || [])
    } catch (err) {
      showError(err.message || 'Failed to load pending reviews')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (status) => {
    if (!selectedFeedback) {
      showError('No feedback selected')
      return
    }

    try {
      await feedbackAPI.reviewFeedback(selectedFeedback.id, status, reviewNotes)
      success(`Feedback successfully ${status}!`)
      setSelectedFeedback(null)
      setReviewNotes('')
      fetchPendingReviews()
    } catch (err) {
      showError(err.message || 'Failed to submit feedback review')
    }
  }

  // Priority color tags
  const getPriorityClass = (priority) => {
    if (priority === 'high') return 'bg-rose-950/40 text-rose-300 border-rose-800/40'
    if (priority === 'medium') return 'bg-amber-950/40 text-amber-300 border-amber-800/40'
    return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
  }

  // Sentiment color tags
  const getSentimentClass = (sentiment) => {
    if (sentiment === 'positive') return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
    if (sentiment === 'negative') return 'bg-rose-950/40 text-rose-300 border-rose-800/40'
    return 'bg-slate-800/60 text-slate-300 border-slate-750'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-poppins text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-primary-400" />
          Pending Reviews
        </h1>
        <p className="text-slate-400 mt-1">Audit customer response quality, flag escalations, and log review assessments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Feedback List (Left Column) */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            // Skeleton loadings
            [1, 2, 3].map(i => (
              <div key={i} className="p-5 glass-panel animate-pulse h-32 border-slate-800"></div>
            ))
          ) : feedback.length === 0 ? (
            <div className="glass-panel p-16 text-center text-slate-500">
              <ClipboardList className="w-12 h-12 mx-auto opacity-35 mb-3" />
              <p className="text-base font-semibold text-slate-400">All caught up!</p>
              <p className="text-xs text-slate-550 mt-1">No feedback is awaiting manual reviewer confirmation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {feedback.map(item => {
                const isSelected = selectedFeedback?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedFeedback(item)
                      setReviewNotes('')
                    }}
                    className={`
                      p-5 glass-panel cursor-pointer transition-all duration-200 border-l-4
                      ${isSelected
                        ? 'border-primary-500 bg-primary-950/10 shadow-lg'
                        : 'border-l-slate-850 hover:bg-slate-900/30 hover:border-l-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          {item.customer_name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">Invoice: {item.invoice_number}</p>
                      </div>
                      <span className={`status-badge ${getPriorityClass(item.priority)}`}>
                        {PRIORITY_LABELS[item.priority] || item.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-medium mb-3">{item.product_name}</p>

                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 text-slate-350">
                        <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                        NPS: <span className="font-bold text-slate-200">{item.nps_score}</span>
                      </span>
                      <span className={`status-badge ${getSentimentClass(item.overall_sentiment)}`}>
                        {item.overall_sentiment}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Review Action Panel (Right Column) */}
        <div className="lg:col-span-1">
          {selectedFeedback ? (
            <div className="glass-panel p-6 border-slate-800 shadow-xl space-y-6 sticky top-24 animate-slide-up">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-5 h-5 text-primary-400" />
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Review Panel</h2>
              </div>

              {/* Attributes lists */}
              <div className="space-y-4 text-xs text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-medium">Customer</span>
                  <span className="font-semibold text-slate-200">{selectedFeedback.customer_name}</span>
                </div>

                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-medium">Product Category</span>
                  <span className="font-semibold text-slate-200">{selectedFeedback.product_name}</span>
                </div>

                <div className="flex justify-between border-b border-slate-850 pb-2 items-center">
                  <span className="text-slate-500 font-medium">NPS Rating</span>
                  <span className="text-sm font-extrabold font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                    {selectedFeedback.nps_score}/10
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-medium">AI Sentiment</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedFeedback.overall_sentiment}</span>
                </div>

                <div className="flex justify-between border-b border-slate-850 pb-2">
                  <span className="text-slate-500 font-medium">Audited Priority</span>
                  <span className="font-semibold text-slate-200 capitalize">{selectedFeedback.priority}</span>
                </div>

                {selectedFeedback.issue_raised && (
                  <div className="p-3.5 rounded-lg bg-rose-955/20 border border-rose-900/40 space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Issues Raised
                    </span>
                    <p className="text-xs text-rose-300/85 leading-relaxed">{selectedFeedback.issue_raised}</p>
                  </div>
                )}
              </div>

              {/* Review Input Notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Internal Review Notes</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Enter notes for resolutions, escalations or feedback audits..."
                  className="w-full bg-slate-950/50 border border-slate-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
                  rows="4"
                />
              </div>

              {/* Approve & Reject options */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleReview('approved')}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md active:scale-95 transition-all text-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview('rejected')}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-md active:scale-95 transition-all text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center py-12">
              <Clock className="w-8 h-8 opacity-35 mb-2" />
              <span>Select a feedback loop from list to complete the manual audit review</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
