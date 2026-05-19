import { useState, useCallback } from 'react'

export function useForm(initialValues, onSubmit, validate) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(e => {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value

    setValues(prev => ({
      ...prev,
      [name]: newValue
    }))

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }, [errors])

  const handleBlur = useCallback(e => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true
    }))

    // Validate single field
    if (validate) {
      const fieldErrors = validate({ [name]: values[name] })
      setErrors(prev => ({
        ...prev,
        [fieldErrors[name] ? name : null]: fieldErrors[name]
      }))
    }
  }, [values, validate])

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      setIsSubmitting(true)

      try {
        // Validate all fields
        if (validate) {
          const fieldErrors = validate(values)
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors)
            setIsSubmitting(false)
            return
          }
        }

        // Call onSubmit
        await onSubmit(values)
      } catch (err) {
        // Error handled by caller
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError
  }
}
