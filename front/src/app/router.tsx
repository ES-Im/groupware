import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { BoardCreatePage } from '@/features/board/pages/BoardCreatePage'
import { BoardDetailPage } from '@/features/board/pages/BoardDetailPage'
import { BoardDraftsPage } from '@/features/board/pages/BoardDraftsPage'
import { BoardEditPage } from '@/features/board/pages/BoardEditPage'
import { BoardListPage } from '@/features/board/pages/BoardListPage'
import { DepartmentDetailPage } from '@/features/department/pages/DepartmentDetailPage'
import { DepartmentMembersPage } from '@/features/department/pages/DepartmentMembersPage'
import { DepartmentsPage } from '@/features/department/pages/DepartmentsPage'
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
 * /departments는 T6.3에서 DepartmentsPage(전사 부서 목록/조직도 페이지)로 연결했다.
 * /departments/:deptId는 T7.1에서 DepartmentDetailPage(부서 상세 컨테이너)로 연결했다.
 * deptId 파라미터 유효성 검사·not-found 분기는 페이지 컴포넌트 내부에서 처리한다.
 * /boards는 T10.3에서 BoardListPage(게시판 목록 페이지)로 연결했다. /boards/:boardId는
 * T11.3에서 BoardDetailPage(게시글 상세 컨테이너)로 연결했다.
 * /boards/new는 T12.2에서 BoardCreatePage(게시글 작성 페이지)로 연결했다. /boards/:boardId/edit는
 * T13.3-a에서 BoardEditPage(게시글 수정 페이지)로 연결했다 — BoardCreatePage의 "임시저장글
 * 불러오기"에서 사용자가 draft를 선택했을 때의 이동 목적지이기도 하다.
 * /boards/drafts는 T15.1에서 BoardDraftsPage(내 임시저장함 페이지)로 연결했다.
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
        path: 'departments',
        element: <DepartmentsPage />,
      },
      {
        path: 'departments/:deptId',
        element: <DepartmentDetailPage />,
      },
      {
        path: 'department-members',
        element: <DepartmentMembersPage />,
      },
      {
        path: 'boards',
        element: <BoardListPage />,
      },
      {
        path: 'boards/new',
        element: <BoardCreatePage />,
      },
      {
        // 내 임시저장함 페이지: M15(T15.1)에서 BoardDraftsPage로 연결했다.
        path: 'boards/drafts',
        element: <BoardDraftsPage />,
      },
      {
        // 게시글 상세 페이지: M11(T11.3)에서 BoardDetailPage로 연결했다. 목록 페이지의
        // 행 클릭 이동이 실제 상세 화면으로 이어진다.
        path: 'boards/:boardId',
        element: <BoardDetailPage />,
      },
      {
        // 게시글 수정 페이지: M13(T13.3-a)에서 BoardEditPage로 연결했다. BoardCreatePage의
        // "임시저장글 불러오기"에서 draft를 선택했을 때의 이동 목적지가 실제 화면으로 이어진다.
        path: 'boards/:boardId/edit',
        element: <BoardEditPage />,
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
