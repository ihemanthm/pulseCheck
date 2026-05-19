import axiosInstance from './client'

export const callsAPI = {
  triggerCalls: async (orderIds) => {
    const response = await axiosInstance.post('/calls/trigger', {
      order_ids: orderIds
    })
    return response.data
  },

  listCalls: async (status = null, page = 1, pageSize = 50) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('page', page)
    params.append('page_size', pageSize)

    const response = await axiosInstance.get(`/calls?${params.toString()}`)
    return response.data
  },

  getCall: async (callId) => {
    const response = await axiosInstance.get(`/calls/${callId}`)
    return response.data
  },

  retryCall: async (callId) => {
    const response = await axiosInstance.post(`/calls/${callId}/retry`)
    return response.data
  }
}
