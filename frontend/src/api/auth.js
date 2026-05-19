import axiosInstance from './client'

export const authAPI = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password
    })
    return response.data
  },

  refresh: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh', {
      refresh_token: refreshToken
    })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}
