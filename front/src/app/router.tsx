import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { DepartmentMembersPage } from '@/features/department/pages/DepartmentMembersPage'
import { EmployeeDetailPage } from '@/features/employee/pages/EmployeeDetailPage'
import { MyInfoPage } from '@/features/employee/pages/MyInfoPage'
import { UpdateMePage } from '@/features/employee/pages/UpdateMePage'
import { ProtectedRoute } from '@/shared/components/ProtectedRoute'
import { LayoutShell } from '@/shared/components/LayoutShell'

/**
 * Router 트리(ROADMAP T0.5·T0.7 / §A-5, §B).
 * LayoutShell을 보호 라우트의 부모로 두고, 실제 도메인 페이지들은 자식 라우트로 중첩한다.
 * 홈은 아직 실제 페이지가 없으므로 이번 범위 밖(placeholder 유지) — 이후 사원 도메인
 * 태스크에서 element를 실제 페이지로 교체한다. /login은 T1.2에서 실제 LoginPage로 교체했다.
 * /register는 T1.5(회원가입)에서 RegisterPage로 연결했다 — LoginPage의 기존 링크가 실제로 동작한다.
 * 둘 다 비인증 라우트(셸 밖)이므로 ProtectedRoute로 감싸지 않는다.
 * /department-members는 T2.1-b에서 DepartmentMembersPage로 연결했다. /employees/:empId는
 * T2.2에서 EmployeeDetailPage(사원 상세 실페이지)로 교체했다. /me는 T2.3에서 MyInfoPage(내 정보
 * 조회 페이지)로 연결했다. /me/edit는 T3.1에서 UpdateMePage(내 정보 수정 페이지)로 연결했다.
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
      {
        path: 'department-members',
        element: <DepartmentMembersPage />,
      },
      {
        path: 'employees/:empId',
        element: <EmployeeDetailPage />,
      },
      {
        path: 'me',
        element: <MyInfoPage />,
      },
      {
        path: 'me/edit',
        element: <UpdateMePage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
])
