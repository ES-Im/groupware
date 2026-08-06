import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/authStore'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)

  if (status === 'idle') {
    return <div role="status">로딩 중...</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return children
}
