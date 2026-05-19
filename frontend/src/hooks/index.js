import { useAuth as useAuthContext } from '../context/AuthContext'

export function useAuth() {
  return useAuthContext()
}

export { useAsync } from './useAsync'
export { useForm } from './useForm'
export { usePagination } from './usePagination'
