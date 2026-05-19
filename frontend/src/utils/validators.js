export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 15
}

export const validateUsername = (username) => {
  return username.length >= 3 && username.length <= 255
}

export const validatePassword = (password) => {
  if (password.length < 8) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/\d/.test(password)) return false
  return true
}

export const validatePasswordStrength = (password) => {
  let strength = 0
  let feedback = []

  if (password.length >= 8) strength++
  else feedback.push('At least 8 characters')

  if (password.length >= 12) strength++

  if (/[A-Z]/.test(password)) strength++
  else feedback.push('At least one uppercase letter')

  if (/[a-z]/.test(password)) strength++

  if (/\d/.test(password)) strength++
  else feedback.push('At least one number')

  if (/[!@#$%^&*]/.test(password)) strength++
  else feedback.push('At least one special character')

  return {
    score: strength,
    strength: strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong',
    feedback
  }
}

export const validateRequired = (value) => {
  return value && value.trim() !== ''
}

export const validateMinLength = (value, min) => {
  return value && value.length >= min
}

export const validateMaxLength = (value, max) => {
  return !value || value.length <= max
}

export const validateCSVFile = (file) => {
  if (!file) return { valid: false, error: 'No file selected' }
  
  if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be CSV format' }
  }

  const maxSize = 10 * 1024 * 1024 // 10 MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File must be less than 10 MB' }
  }

  return { valid: true }
}

export const validateInvoiceNumber = (invoice) => {
  return invoice && invoice.trim() !== '' && invoice.length <= 50
}

export const validateAmount = (amount) => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

export const validateNPS = (nps) => {
  const num = parseInt(nps, 10)
  return !isNaN(num) && num >= 0 && num <= 10
}
