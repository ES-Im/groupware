import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { MyAttendancePage } from '@/features/attendance/pages/MyAttendancePage'
import { DeptAttendancePage } from '@/features/attendance/pages/DeptAttendancePage'
import { DocumentBoxHomePage } from '@/features/approval/pages/DocumentBoxHomePage'
import { DraftDetailPage } from '@/features/approval/pages/DraftDetailPage'
import { GeneralDraftCreatePage } from '@/features/approval/pages/GeneralDraftCreatePage'
import { GeneralDraftEditPage } from '@/features/approval/pages/GeneralDraftEditPage'
import { BusinessTripDraftCreatePage } from '@/features/approval/pages/BusinessTripDraftCreatePage'
import { BusinessTripDraftEditPage } from '@/features/approval/pages/BusinessTripDraftEditPage'
import { MyBusinessTripHistoryPage } from '@/features/approval/pages/MyBusinessTripHistoryPage'
import { DeptBusinessTripHistoryPage } from '@/features/approval/pages/DeptBusinessTripHistoryPage'
import { LeaveDraftCreatePage } from '@/features/approval/pages/LeaveDraftCreatePage'
import { LeaveDraftEditPage } from '@/features/approval/pages/LeaveDraftEditPage'
import { SalesDraftCreatePage } from '@/features/approval/pages/SalesDraftCreatePage'
import { SalesDraftEditPage } from '@/features/approval/pages/SalesDraftEditPage'
import { MyLeavePage } from '@/features/leave/pages/MyLeavePage'
import { DeptLeavePage } from '@/features/leave/pages/DeptLeavePage'
import { AdminLeavePage } from '@/features/leave/pages/AdminLeavePage'
import { BoardCreatePage } from '@/features/board/pages/BoardCreatePage'
import { BoardDetailPage } from '@/features/board/pages/BoardDetailPage'
import { BoardDraftsPage } from '@/features/board/pages/BoardDraftsPage'
import { BoardEditPage } from '@/features/board/pages/BoardEditPage'
import { BoardListPage } from '@/features/board/pages/BoardListPage'
import { DepartmentDetailPage } from '@/features/department/pages/DepartmentDetailPage'
import { DepartmentMembersPage } from '@/features/department/pages/DepartmentMembersPage'
import { DepartmentsPage } from '@/features/department/pages/DepartmentsPage'
import { CompanyInfoPage } from '@/features/company/pages/CompanyInfoPage'
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
 * /approval/box/:tab(상신함/결재대기함/결재함/임시저장함 4탭 통합)은 문서함 UI 통합 작업에서
 * 기존 5개 개별 라우트(/approval/box/home, /approval/box/submitted, /approval/box/unsubmitted,
 * /approval/box/pending, /approval/box/accessible — M1/T1.7·M7/T7.3에서 SubmittedDraftsPage/
 * UnsubmittedDraftsPage/PendingApprovalDraftsPage/AccessibleDocumentsPage/DocumentBoxHomePage로
 * 각각 연결했던 것)를 하나의 동적 라우트로 통합한 것이다. tab 값 해석(submitted/unsubmitted/pending/
 * accessible)·유효성 검사는 DocumentBoxHomePage 내부에서 처리한다(라우트 자체는 단순 동적 세그먼트).
 * 4개 페이지 컴포넌트 파일은 DocumentBoxHomePage가 탭별 로직을 흡수하는 후속 UI 작업 전까지 그대로
 * 남겨둔다. /approval/box(세그먼트 없음)는 결재대기함(pending)으로 리다이렉트한다 — 결재 대기가
 * 사용자가 가장 먼저 처리해야 할 액션 문서라 기본 진입 탭으로 삼는다. 전 항목 minRole EMPLOYEE라
 * 별도 RoleGuard 없이 ProtectedRoute(인증 가드)만으로 충분하다.
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
 * /approval/drafts/leaves/new, /approval/drafts/leaves/:draftId/edit, /leaves/me, /leaves/dept,
 * /leaves/admin은 ROADMAP(LEAVE) M6(T6.1)에서 연가(휴가) 기안 4종 페이지(LeaveDraftCreatePage/F740,
 * LeaveDraftEditPage/F741, MyLeavePage/F742·F743, DeptLeavePage/F744~F746, AdminLeavePage/F747~F750)로
 * 연결했다. 'drafts/leaves/new'는 ②'drafts/new'·③'drafts/business-trips/new'와 동일 근거로 정적
 * 세그먼트를 동적 ':draftId'보다 앞에 등록해 둔다. 'drafts/leaves/:draftId/edit'는 'drafts/:draftId/edit'
 * (일반 기안 수정, 4세그먼트)와는 세그먼트 깊이가 달라, 'drafts/business-trips/:draftId/edit'(출장 기안
 * 수정, 동일 5세그먼트)와는 3번째 리터럴 세그먼트('leaves' vs 'business-trips')로 구분되어 랭킹 충돌이
 * 없다 — 상세 페이지 DrafterActions.handleEdit의 isLeaveDraft 분기가 실제
 * 이동 목적지로 이어진다. 'leaves/me'·'leaves/dept'·'leaves/admin'은 minRole만 다를 뿐(내 휴가
 * EMPLOYEE, 부서 휴가 관리 DEPT_MANAGER, 관리자 휴가 현황 ADMIN) 근태 /attendance/dept·출장 이력
 * 컨벤션과 동일하게 라우트 자체는 ProtectedRoute(인증 가드)만 적용하고 최종 권한 판단은 서버(403
 * ROLE_003)에 위임한다 — role 게이팅은 사이드바(minRole)에서만 처리한다.
 * /approval/drafts/sales/new, /approval/drafts/sales/:draftId/edit는 ROADMAP(SALES) M4(T4.1)에서
 * 매출 기안 2종 페이지(SalesDraftCreatePage/F760, SalesDraftEditPage/F761)로 연결했다.
 * 'drafts/sales/new'는 ②'drafts/new'·③'drafts/business-trips/new'·④'drafts/leaves/new'와 동일
 * 근거로 정적 세그먼트를 동적 ':draftId'보다 앞에 등록해 둔다. 'drafts/sales/:draftId/edit'는
 * 'drafts/:draftId/edit'(일반 기안 수정, 4세그먼트)와는 세그먼트 깊이가 달라,
 * 'drafts/business-trips/:draftId/edit'·'drafts/leaves/:draftId/edit'(각 5세그먼트)와는 3번째
 * 리터럴 세그먼트('sales' vs 'business-trips'/'leaves')로 구분되어 랭킹 충돌이 없다 — 상세 페이지
 * DrafterActions.handleEdit의 isSalesDraft 분기가 실제 이동 목적지로 이어진다.
 * 채팅은 더 이상 별도 라우트가 아니다 — 헤더 아이콘 클릭 시 LayoutShell 내부에 조건부로
 * 마운트되는 오버레이 패널(ChatOverlayPanel, src/shared/components/LayoutShell.tsx)로
 * 전환됐다(팝업 창 → 인앱 오버레이 구조 변경). 목록/상세 패널 전환은 chatOverlayStore의
 * selectedRoomId로 처리하므로 라우터 트리에는 chat 관련 라우트가 없다.
 * /settings/company는 ROADMAP(COMPANY) T1.3에서 CompanyInfoPage(F1401)로 연결했다. 사이드바
 * 노출은 minRole ADMIN이지만, 조회 API가 permitAll이라 라우트 가드는 의도적으로 EMPLOYEE
 * 수준(ProtectedRoute만)으로 둔다 — URL 직접 접근 시에도 읽기 전용 뷰가 정상 렌더되어야 한다.
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
        // 문서함 인덱스: 세그먼트 없이 접근 시 기본 탭(결재대기함)으로 리다이렉트한다.
        path: 'approval/box',
        element: <Navigate to="/approval/box/pending" replace />,
      },
      {
        // 문서함 통합 페이지: 상신함/임시저장함/결재대기함/결재함 4탭을 DocumentBoxHomePage 하나로
        // 통합했다(탭 딥링크). tab 유효성 검사·해석은 컴포넌트 내부에서 처리한다.
        path: 'approval/box/:tab',
        element: <DocumentBoxHomePage />,
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
        // 휴가 기안 작성 페이지: ROADMAP(LEAVE) M1(T1.3)에서 LeaveDraftCreatePage(F740)로 연결했다.
        // ②'drafts/new'·③'drafts/business-trips/new'와 동일 근거로 정적 세그먼트 'leaves/new'를
        // 동적 ':draftId'보다 앞에 등록해 둔다.
        path: 'approval/drafts/leaves/new',
        element: <LeaveDraftCreatePage />,
      },
      {
        // 매출 기안 작성 페이지: ROADMAP(SALES) M2(T2.3)에서 SalesDraftCreatePage(F760)로 연결했다.
        // ②'drafts/new'·③'drafts/business-trips/new'·④'drafts/leaves/new'와 동일 근거로 정적
        // 세그먼트 'sales/new'를 동적 ':draftId'보다 앞에 등록해 둔다.
        path: 'approval/drafts/sales/new',
        element: <SalesDraftCreatePage />,
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
        // 휴가 기안 수정 페이지: ROADMAP(LEAVE) M2(T2.4)에서 LeaveDraftEditPage(F741)로 연결했다.
        // 상세 DrafterActions.handleEdit의 isLeaveDraft 분기가 실제 이동 목적지로 이어진다. 위
        // 'drafts/:draftId/edit'(일반 기안 수정, 4세그먼트)와는 세그먼트 깊이가 달라,
        // 'drafts/business-trips/:draftId/edit'(출장 기안 수정, 동일 5세그먼트)와는 3번째 리터럴
        // 세그먼트('leaves' vs 'business-trips')로 구분되어 랭킹 충돌이 없다.
        path: 'approval/drafts/leaves/:draftId/edit',
        element: <LeaveDraftEditPage />,
      },
      {
        // 매출 기안 수정 페이지: ROADMAP(SALES) M3(T3.4)에서 SalesDraftEditPage(F761)로 연결했다.
        // 상세 DrafterActions.handleEdit의 isSalesDraft 분기가 실제 이동 목적지로 이어진다. 위
        // 'drafts/:draftId/edit'(일반 기안 수정, 4세그먼트)와는 세그먼트 깊이가 달라,
        // 'drafts/business-trips/:draftId/edit'·'drafts/leaves/:draftId/edit'(각 5세그먼트)와는
        // 3번째 리터럴 세그먼트('sales' vs 'business-trips'/'leaves')로 구분되어 랭킹 충돌이 없다.
        path: 'approval/drafts/sales/:draftId/edit',
        element: <SalesDraftEditPage />,
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
      {
        // 내 휴가 페이지: ROADMAP(LEAVE) M3(T3.2)에서 MyLeavePage(F742·F743)로 연결했다. minRole
        // EMPLOYEE라 ProtectedRoute(인증 가드)만으로 충분하다.
        path: 'leaves/me',
        element: <MyLeavePage />,
      },
      {
        // 부서 휴가 관리 페이지: ROADMAP(LEAVE) M4(T4.3)에서 DeptLeavePage(F744~F746)로 연결했다.
        // minRole DEPT_MANAGER 게이팅은 사이드바에서 처리하고(근태 /attendance/dept 컨벤션 동일),
        // 라우트 자체는 ProtectedRoute(인증 가드)만 적용한다 — 최종 권한 판단은 서버(403 ROLE_003).
        path: 'leaves/dept',
        element: <DeptLeavePage />,
      },
      {
        // 관리자 휴가 현황 페이지: ROADMAP(LEAVE) M5(T5.3)에서 AdminLeavePage(F747~F750)로 연결했다.
        // minRole ADMIN 게이팅은 사이드바에서 처리하고, 라우트 자체는 ProtectedRoute(인증 가드)만
        // 적용한다(ADMIN 단일 게이트, 서버 최종 판단 없음).
        path: 'leaves/admin',
        element: <AdminLeavePage />,
      },
      {
        // 회사 정보 페이지: ROADMAP(COMPANY) T1.3에서 CompanyInfoPage(F1401)로 연결했다. 조회 API가
        // permitAll이라 사이드바(minRole ADMIN)와 달리 라우트 자체는 EMPLOYEE 기준 ProtectedRoute
        // (인증 가드)만 적용한다 — 비-ADMIN이 URL을 직접 입력해도 읽기 전용 뷰가 정상 렌더되어야 한다.
        path: 'settings/company',
        element: <CompanyInfoPage />,
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
