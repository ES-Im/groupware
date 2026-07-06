import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'
import { useBootstrapAuth } from '@/features/auth/hooks/useBootstrapAuth'
import { router } from './router'

/**
 * 앱 루트 컴포넌트(ROADMAP T1.4).
 *
 * useBootstrapAuth를 라우팅 트리 바깥에서 1회 마운트해 새로고침/최초 진입 시 세션 복원
 * (reissue → me)을 수행한다. ProtectedRoute(T0.5)는 authStore.status를 구독해 복원 중
 * (idle)엔 로딩을, 복원 결과(authenticated/unauthenticated)에 따라 자식 렌더/로그인 리디렉션을
 * 분기하므로, 이 컴포넌트가 router보다 상위에서 status 전이를 트리거해주기만 하면 된다.
 */
export function App() {
  useBootstrapAuth()

  return (
    <>
      <RouterProvider router={router} />
      {/* handleApiError(T0.2c)의 토스트 폴백이 실제로 보이려면 전역에 한 번 마운트돼 있어야 한다. */}
      <Toaster richColors position="top-center" />
    </>
  )
}
