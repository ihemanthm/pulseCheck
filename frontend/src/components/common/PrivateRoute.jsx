import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import Loading from './Loading'

export default function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth()

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/orders" replace />
  }

  return children
}
