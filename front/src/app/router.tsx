import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { LayoutShell } from '@/shared/components/LayoutShell'

/**
 * Router 트리(ROADMAP T0.5·T0.7 / §A-5, §B).
 * LayoutShell을 보호 라우트의 부모로 두고, 실제 도메인 페이지들은 자식 라우트로 중첩한다.
 * 실제 도메인 페이지(홈, 로그인)는 아직 없으므로 이번 태스크 범위(셸 배관 확인)만 만족하는
 * placeholder를 둔다. 이후 인증/사원 도메인 태스크에서 각 element를 실제 페이지로 교체한다.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <div>홈(placeholder, 인증/사원 도메인 태스크에서 교체)</div>,
      },
    ],
  },
  {
    path: '/login',
    element: <div>로그인 페이지(auth 도메인 구현 전 placeholder)</div>,
  },
])
