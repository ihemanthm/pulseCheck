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
  }
}
