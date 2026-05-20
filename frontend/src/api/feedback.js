import axiosInstance from './client'

export const feedbackAPI = {
  getPendingReviews: async (page = 1, pageSize = 50) => {
    const response = await axiosInstance.get(
      `/feedback/pending?page=${page}&page_size=${pageSize}`
    )
    return response.data
  },

  reviewFeedback: async (feedbackId, status, notes = '') => {
    const response = await axiosInstance.post(`/feedback/${feedbackId}/review`, {
      status,
      notes
    })
    return response.data
  },

  getFeedbackDetail: async (feedbackId) => {
    const response = await axiosInstance.get(`/feedback/${feedbackId}`)
    return response.data
  },

  getFeedbacks: async (sentiment = '', npsCategory = '', search = '', page = 1, pageSize = 50) => {
    const params = new URLSearchParams()
    if (sentiment) params.append('sentiment', sentiment)
    if (npsCategory) params.append('nps_category', npsCategory)
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('page_size', pageSize)
    
    const response = await axiosInstance.get(`/feedback?${params.toString()}`)
    return response.data
  }
}
