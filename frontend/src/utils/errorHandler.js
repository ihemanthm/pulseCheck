export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const handleAxiosError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    const message = data?.detail || data?.error || error.message
    throw new ApiError(message, status, data)
  } else if (error.request) {
    // Request made but no response
    throw new ApiError('No response from server. Please check your connection.', 0, null)
  } else {
    // Error during request setup
    throw new ApiError(error.message, 0, null)
  }
}

export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error?.response?.data?.error) {
    return error.response.data.error
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const getErrorStatus = (error) => {
  if (error instanceof ApiError) {
    return error.status
  }
  return error?.response?.status || 0
}

export const is401Error = (error) => {
  return getErrorStatus(error) === 401
}

export const is403Error = (error) => {
  return getErrorStatus(error) === 403
}

export const is404Error = (error) => {
  return getErrorStatus(error) === 404
}

export const is422Error = (error) => {
  return getErrorStatus(error) === 422
}

export const getFieldErrors = (error) => {
  if (error?.response?.data?.detail && Array.isArray(error.response.data.detail)) {
    const errors = {}
    error.response.data.detail.forEach(err => {
      const field = err.loc?.[1] || 'general'
      errors[field] = err.msg
    })
    return errors
  }
  return {}
}

export const formatValidationErrors = (errors) => {
  if (typeof errors === 'string') {
    return errors
  }
  if (Array.isArray(errors)) {
    return errors.join(', ')
  }
  if (typeof errors === 'object') {
    return Object.values(errors).join(', ')
  }
  return 'Validation error'
}
