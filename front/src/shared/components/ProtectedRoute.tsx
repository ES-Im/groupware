import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth/store/authStore'

/**
 * 인증 상태에 따라 자식을 게이팅한다: 세션 복원 중(idle)엔 로딩,
 * 미인증(unauthenticated)이면 로그인 페이지로 리디렉션, 인증됨(authenticated)이면 자식을 렌더링한다.
 * status는 authStore(zustand)를 참조하며 bootstrap(T1.4) 완료 여부에 따라 idle → authenticated/unauthenticated로 전이된다.
 */
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
