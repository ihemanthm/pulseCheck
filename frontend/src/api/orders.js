import axiosInstance from './client'

export const ordersAPI = {
  uploadCSV: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post('/orders/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  listOrders: async (status = null, search = null, page = 1, pageSize = 50) => {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (search) params.append('search', search)
    params.append('page', page)
    params.append('page_size', pageSize)

    const response = await axiosInstance.get(`/orders?${params.toString()}`)
    return response.data
  },

  getOrder: async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}`)
    return response.data
  },

  getWebhookStatus: async (orderId) => {
    const response = await axiosInstance.get(`/orders/${orderId}/webhook-status`)
    return response.data
  }
}
