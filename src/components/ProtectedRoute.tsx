import { Navigate } from 'react-router-dom'

import type { UserProfile, UserRole } from '../types'

type ProtectedRouteProps = {
  profile: UserProfile | null
  allowedRoles: UserRole[]
  isLoading: boolean
  children: React.ReactNode
}

function getDefaultDashboardPath(role: UserRole): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TUTOR') return '/tutor'
  if (role === 'STUDENT') return '/student'

  return '/'
}

function ProtectedRoute({
  profile,
  allowedRoles,
  isLoading,
  children,
}: ProtectedRouteProps) {
  if (isLoading) {
    return null
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to={getDefaultDashboardPath(profile.role)} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute