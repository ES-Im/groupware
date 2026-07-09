import { createBrowserRouter } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { MyAttendancePage } from '@/features/attendance/pages/MyAttendancePage'
import { DeptAttendancePage } from '@/features/attendance/pages/DeptAttendancePage'
import { DocumentBoxHomePage } from '@/features/approval/pages/DocumentBoxHomePage'
import { SubmittedDraftsPage } from '@/features/approval/pages/SubmittedDraftsPage'
import { UnsubmittedDraftsPage } from '@/features/approval/pages/UnsubmittedDraftsPage'
import { PendingApprovalDraftsPage } from '@/features/approval/pages/PendingApprovalDraftsPage'
import { AccessibleDocumentsPage } from '@/features/approval/pages/AccessibleDocumentsPage'
import { DraftDetailPage } from '@/features/approval/pages/DraftDetailPage'
import { GeneralDraftCreatePage } from '@/features/approval/pages/GeneralDraftCreatePage'
import { GeneralDraftEditPage } from '@/features/approval/pages/GeneralDraftEditPage'
import { BusinessTripDraftCreatePage } from '@/features/approval/pages/BusinessTripDraftCreatePage'
import { BusinessTripDraftEditPage } from '@/features/approval/pages/BusinessTripDraftEditPage'
import { MyBusinessTripHistoryPage } from '@/features/approval/pages/MyBusinessTripHistoryPage'
import { DeptBusinessTripHistoryPage } from '@/features/approval/pages/DeptBusinessTripHistoryPage'
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
 * /attendance/me는 T1.6에서 MyAttendancePage(내 근태 조회 페이지)로 연결했다.
 * /attendance/dept는 T3.5에서 DeptAttendancePage(부서 근태 승인 페이지)로 연결했다.
 * /approval/box/submitted, /approval/box/unsubmitted, /approval/box/pending,
 * /approval/box/accessible은 전자결재 공통 도메인 M1(T1.7)에서 4종 문서함 페이지
 * (SubmittedDraftsPage/UnsubmittedDraftsPage/PendingApprovalDraftsPage/AccessibleDocumentsPage)로
 * 연결했다. 전 항목 minRole EMPLOYEE라 별도 RoleGuard 없이 ProtectedRoute(인증 가드)만으로 충분하다.
 * 문서함 홈(/approval/box/home)은 M7(T7.3)에서 DocumentBoxHomePage(F715 요약 카드·F711 결재대기
 * 강조)로 연결했다 — minRole EMPLOYEE라 위 4종 문서함과 동일하게 ProtectedRoute만으로 충분하다.
 * /approval/drafts/:draftId는 M2(T2.5)에서 DraftDetailPage(기안서 상세 read-only 페이지)로
 * 연결했다 — 4종 문서함 페이지의 행 클릭 이동이 실제 상세 화면으로 이어진다. draftId 파라미터
 * 유효성 검사·403/404 분기는 DraftDetailPage 내부에서 처리하므로 minRole EMPLOYEE 기준
 * ProtectedRoute(인증 가드)만으로 충분하다.
 * /approval/drafts/new는 일반 기안 작성(DRAFT-COMMON)에서 GeneralDraftCreatePage(F720)로 연결했다.
 * /approval/drafts/:draftId/edit는 일반 기안 수정(DRAFT-COMMON)에서 GeneralDraftEditPage(F721)로
 * 연결했다 — 상세 페이지의 [수정] 액션(resolveDrafterActions.canEdit)이 실제 이동 목적지로 이어진다.
 * 정적 세그먼트 'new'는 React Router 7 랭킹 규칙상 동적 ':draftId'보다 항상 우선 매칭되지만,
 * 명시적으로도 ':draftId'보다 앞에 등록해 둔다. draftId 파라미터 유효성 검사(10진 양의 정수 가드)·
 * 403/404·유형(isGeneralDraft)·권한(canEdit) 분기는 두 페이지 내부에서 처리하므로 minRole EMPLOYEE
 * 기준 ProtectedRoute(인증 가드)만으로 충분하다.
 * /approval/drafts/business-trips/new, /approval/drafts/business-trips/:draftId/edit,
 * /approval/business-trips/me/history, /approval/business-trips/dept/history는
 * ROADMAP(DRAFT-BUSINESSTRIP) T1.4·T2.4·T4.3·T5.3에서 출장 기안 4종 페이지
 * (BusinessTripDraftCreatePage/F730, BusinessTripDraftEditPage/F731, MyBusinessTripHistoryPage/F733,
 * DeptBusinessTripHistoryPage/F734)로 연결했다. 'business-trips/new'는 ②'drafts/new'와 동일 근거로
 * ':draftId'보다 앞에 등록한다. 'business-trips/:draftId/edit'는 'drafts/:draftId/edit'(일반 기안
 * 수정)와 세그먼트 깊이가 달라(리터럴 'business-trips' 포함) 랭킹 충돌이 없다 — 상세 페이지
 * DrafterActions.handleEdit의 isBusinessTripDraft 분기가 실제 이동 목적지로 이어진다. 이력 2종은
 * minRole만 다를 뿐(내 이력 EMPLOYEE, 부서 이력 DEPT_MANAGER) 근태 /attendance/dept 컨벤션과 동일하게
 * 라우트 자체는 ProtectedRoute(인증 가드)만 적용하고 최종 권한 판단은 서버(403 ROLE_003)에 위임한다 —
 * role 게이팅은 사이드바(minRole)에서만 처리한다.
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
      {
        path: 'attendance/me',
        element: <MyAttendancePage />,
      },
      {
        path: 'attendance/dept',
        element: <DeptAttendancePage />,
      },
      {
        // 문서함 홈 페이지: M7(T7.3)에서 DocumentBoxHomePage(F715·F711)로 연결했다.
        path: 'approval/box/home',
        element: <DocumentBoxHomePage />,
      },
      {
        // 상신함 페이지: M1(T1.7)에서 SubmittedDraftsPage(F712)로 연결했다.
        path: 'approval/box/submitted',
        element: <SubmittedDraftsPage />,
      },
      {
        // 임시저장함 페이지: M1(T1.7)에서 UnsubmittedDraftsPage(F713)로 연결했다.
        path: 'approval/box/unsubmitted',
        element: <UnsubmittedDraftsPage />,
      },
      {
        // 결재대기함 페이지: M1(T1.7)에서 PendingApprovalDraftsPage(F710)로 연결했다.
        path: 'approval/box/pending',
        element: <PendingApprovalDraftsPage />,
      },
      {
        // 결재함(조회 가능 문서) 페이지: M1(T1.7)에서 AccessibleDocumentsPage(F714)로 연결했다.
        path: 'approval/box/accessible',
        element: <AccessibleDocumentsPage />,
      },
      {
        // 일반 기안 작성 페이지: DRAFT-COMMON에서 GeneralDraftCreatePage(F720)로 연결했다.
        // 정적 세그먼트라 동적 approval/drafts/:draftId보다 항상 우선 매칭되지만(React Router 7
        // 랭킹 규칙), 명시적으로도 :draftId보다 앞에 등록해 둔다.
        path: 'approval/drafts/new',
        element: <GeneralDraftCreatePage />,
      },
      {
        // 출장 기안 작성 페이지: ROADMAP(DRAFT-BUSINESSTRIP) M1(T1.4)에서
        // BusinessTripDraftCreatePage(F730)로 연결했다. ②'drafts/new'와 동일 근거로 정적 세그먼트
        // 'business-trips/new'를 동적 ':draftId'보다 앞에 등록해 둔다.
        path: 'approval/drafts/business-trips/new',
        element: <BusinessTripDraftCreatePage />,
      },
      {
        // 기안서 상세 페이지: M2(T2.5)에서 DraftDetailPage(F701)로 연결했다. 4종 문서함 페이지의
        // 행 클릭 이동이 실제 상세 화면으로 이어진다.
        path: 'approval/drafts/:draftId',
        element: <DraftDetailPage />,
      },
      {
        // 일반 기안 수정 페이지: DRAFT-COMMON에서 GeneralDraftEditPage(F721)로 연결했다. 상세
        // 페이지의 [수정] 액션이 실제 이동 목적지로 이어진다.
        path: 'approval/drafts/:draftId/edit',
        element: <GeneralDraftEditPage />,
      },
      {
        // 출장 기안 수정 페이지: ROADMAP(DRAFT-BUSINESSTRIP) M2(T2.4)에서
        // BusinessTripDraftEditPage(F731)로 연결했다. 상세 DrafterActions.handleEdit의
        // isBusinessTripDraft 분기가 실제 이동 목적지로 이어진다. 위 'drafts/:draftId/edit'(일반
        // 기안 수정)와 세그먼트 깊이가 달라(리터럴 'business-trips' 포함) 랭킹 충돌이 없다.
        path: 'approval/drafts/business-trips/:draftId/edit',
        element: <BusinessTripDraftEditPage />,
      },
      {
        // 내 출장 이력 페이지: ROADMAP(DRAFT-BUSINESSTRIP) M4(T4.3)에서
        // MyBusinessTripHistoryPage(F733)로 연결했다. minRole EMPLOYEE라 ProtectedRoute(인증
        // 가드)만으로 충분하다.
        path: 'approval/business-trips/me/history',
        element: <MyBusinessTripHistoryPage />,
      },
      {
        // 부서 출장 이력 페이지: ROADMAP(DRAFT-BUSINESSTRIP) M5(T5.3)에서
        // DeptBusinessTripHistoryPage(F734)로 연결했다. minRole DEPT_MANAGER 게이팅은 사이드바에서
        // 처리하고(근태 /attendance/dept 컨벤션 동일), 라우트 자체는 ProtectedRoute(인증 가드)만
        // 적용한다 — 최종 권한 판단은 서버(403 ROLE_003).
        path: 'approval/business-trips/dept/history',
        element: <DeptBusinessTripHistoryPage />,
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
