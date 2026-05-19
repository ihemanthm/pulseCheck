import axiosInstance from './client'

export const analyticsAPI = {
  getSummary: async () => {
    const response = await axiosInstance.get('/analytics/summary')
    return response.data
  },

  getNPSTrend: async (days = 30) => {
    const response = await axiosInstance.get(`/analytics/nps-trend?days=${days}`)
    return response.data
  },

  getCallOutcomes: async () => {
    const response = await axiosInstance.get('/analytics/call-outcomes')
    return response.data
  },

  getSentimentByProduct: async () => {
    const response = await axiosInstance.get('/analytics/sentiment-by-product')
    return response.data
  },

  getTopIssues: async (limit = 10) => {
    const response = await axiosInstance.get(`/analytics/top-issues?limit=${limit}`)
    return response.data
  },

  getPendingReviews: async (page = 1, pageSize = 50) => {
    const response = await axiosInstance.get(
      `/analytics/pending-reviews?page=${page}&page_size=${pageSize}`
    )
    return response.data
  },

  getAuditTrail: async (page = 1, pageSize = 50) => {
    const response = await axiosInstance.get(
      `/analytics/audit-trail?page=${page}&page_size=${pageSize}`
    )
    return response.data
  }
}
