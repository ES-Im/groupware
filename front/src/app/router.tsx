import { createBrowserRouter, Navigate } from 'react-router'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { HomePage } from '@/features/home/pages/HomePage'
import { RegisterPage } from '@/features/auth/pages/RegisterPage'
import { MyAttendancePage } from '@/features/attendance/pages/MyAttendancePage'
import { DeptAttendancePage } from '@/features/attendance/pages/DeptAttendancePage'
import { DocumentBoxHomePage } from '@/features/approval/pages/DocumentBoxHomePage'
import { CancellationDraftCreatePage } from '@/features/approval/pages/CancellationDraftCreatePage'
import { DraftCreatePreviewPage } from '@/features/approval/pages/DraftCreatePreviewPage'
import { DraftDetailPage } from '@/features/approval/pages/DraftDetailPage'
import { DraftPrintPreviewPage } from '@/features/approval/pages/DraftPrintPreviewPage'
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
import { DepartmentExplorerEmptyState } from '@/features/department/pages/DepartmentExplorerEmptyState'
import { DepartmentMembersPage } from '@/features/department/pages/DepartmentMembersPage'
import { DepartmentsExplorerLayout } from '@/features/department/pages/DepartmentsExplorerLayout'
import { CompanyInfoPage } from '@/features/company/pages/CompanyInfoPage'
import { MessageBoxPage } from '@/features/message/pages/MessageBoxPage'
import { EmployeeDetailPage } from '@/features/employee/pages/EmployeeDetailPage'
import { EmpManagementListPage } from '@/features/employee/pages/EmpManagementListPage'
import { MyInfoPage } from '@/features/employee/pages/MyInfoPage'
import { NewEmployeeApprovalListPage } from '@/features/employee/registration/pages/NewEmployeeApprovalListPage'
import { MyMeetingCalendarPage } from '@/features/meeting/pages/MyMeetingCalendarPage'
import { MeetingReservationCreatePage } from '@/features/meeting/pages/MeetingReservationCreatePage'
import { MeetingReservationManagementPage } from '@/features/meeting/pages/MeetingReservationManagementPage'
import { MeetingRoomManagementPage } from '@/features/meeting/pages/MeetingRoomManagementPage'
import { MeetingRoomDetailPage } from '@/features/meeting/pages/MeetingRoomDetailPage'
import { MeetingRoomManagementDetailPage } from '@/features/meeting/pages/MeetingRoomManagementDetailPage'
import { FranchiseListPage } from '@/features/franchise/pages/FranchiseListPage'
import { FranchiseDetailPage } from '@/features/franchise/pages/FranchiseDetailPage'
import { FranchiseEducationCalendarPage } from '@/features/franchise/pages/FranchiseEducationCalendarPage'
import { FranchiseEducationCreatePage } from '@/features/franchise/pages/FranchiseEducationCreatePage'
import { FranchiseEducationDetailPage } from '@/features/franchise/pages/FranchiseEducationDetailPage'
import { FranchiseInquiryListPage } from '@/features/franchise/pages/FranchiseInquiryListPage'
import { FranchiseInquiryDetailPage } from '@/features/franchise/pages/FranchiseInquiryDetailPage'
import { ScheduleCalendarPage } from '@/features/schedule/pages/ScheduleCalendarPage'
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
 * 조회 페이지)로 연결했다. 내 정보 수정은 T3.1에서 /me/edit 전용 페이지(UpdateMePage)로 시작했으나
 * adapt-ui 2차 수정에서 MyInfoPage 내 UpdateMeDialog 모달로 전환하며 라우트 자체를 제거했다.
 * /departments는 탐색형 조직도(좌측 트리 + 우측 상세, master-detail)로 재구성했다. 표 목록
 * 페이지(DepartmentsPage, T6.3)는 DepartmentsExplorerLayout(레이아웃 라우트)으로 대체됐고,
 * /departments(index)는 DepartmentExplorerEmptyState(부서 미선택 안내), /departments/:deptId는
 * 기존 DepartmentDetailPage(T7.1, 우측 상세 영역 내용만 그리도록 리팩터)를 자식 라우트로 중첩한다.
 * 경로 문자열 자체는 그대로 유지해 기존 딥링크가 깨지지 않는다. deptId 파라미터 유효성 검사·
 * not-found 분기는 DepartmentDetailPage 내부에서 처리한다.
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
 * /approval/drafts/:draftId/print(DraftPrintPreviewPage)·/approval/drafts/preview
 * (DraftCreatePreviewPage)는 인쇄 전용 새 창(window.open)으로 열리는 화면이라 사이드바/탑바
 * 크롬이 없어야 한다 — /login·/register와 동일하게 LayoutShell 밖 형제 라우트로 등록하되,
 * 인증은 필요하므로 ProtectedRoute로만 감싼다. 전자는 상신된 기안(draftId 있음)을 서버
 * 재조회해 보여주고, 후자는 작성 중(draftId 없음) 폼 스냅샷을 sessionStorage로 건네받아
 * 보여준다(핸드오프 계약은 features/approval/model/draftPreview.ts).
 * /settings/company는 ROADMAP(COMPANY) T1.3에서 CompanyInfoPage(F1401)로 연결했다. 사이드바
 * 노출은 minRole ADMIN이지만, 조회 API가 permitAll이라 라우트 가드는 의도적으로 EMPLOYEE
 * 수준(ProtectedRoute만)으로 둔다 — URL 직접 접근 시에도 읽기 전용 뷰가 정상 렌더되어야 한다.
 * /meetings·/meetings/new·/meetings/management·/meetings/:meetingId·/meeting-rooms/:meetingRoomId·
 * /meeting-rooms/management·/meeting-rooms/management/:meetingRoomId는 ROADMAP(MEETING-ROOMS)
 * M8(T8.1)에서 회의/회의실 페이지 7종(MyMeetingCalendarPage/F800, MeetingReservationCreatePage/
 * F802·F803, MeetingReservationDetailPage/F801·F804~F806, MeetingRoomDetailPage/F807~F809,
 * MeetingReservationManagementPage/F810, MeetingRoomManagementPage/F811·F812·F814,
 * MeetingRoomManagementDetailPage/F813·F815·F816·F814)로 연결했다. 'meetings/new'·
 * 'meetings/management'는 정적 세그먼트라 React Router 7 랭킹 규칙상 동적 'meetings/:meetingId'보다
 * 항상 우선 매칭되지만(위 기안 라우트들과 동일 근거), 명시적으로도 ':meetingId'보다 앞에 등록해 둔다.
 * 'meeting-rooms/management'도 동일 근거로 'meeting-rooms/:meetingRoomId'보다 앞에 둔다.
 * 'meeting-rooms/management/:meetingRoomId'는 3세그먼트라 'meeting-rooms/management'(2세그먼트)와
 * 랭킹 충돌이 없다. 예약 계열(meetings/new·meetings/:meetingId)은 minRole EMPLOYEE, 관리 계열
 * (meetings/management·meeting-rooms/management·meeting-rooms/management/:meetingRoomId)·열람
 * (meeting-rooms/:meetingRoomId)은 각각 FACILITY/EMPLOYEE이지만, 근태 /attendance/dept·전자결재·휴가
 * 컨벤션과 동일하게 role 게이팅은 사이드바(minRole)에서만 처리하고 라우트 자체는 전부
 * ProtectedRoute(인증 가드)만 적용한다 — 최종 권한 판단은 서버(403 ROLE_003)에 위임한다.
 * /messages·/messages/:box는 ROADMAP(MESSAGE) T1.3에서 MessageBoxPage 셸로 연결했다. /messages
 * (세그먼트 없음)는 받은 쪽지함(received)으로 리다이렉트한다 — 받은 쪽지함이 사용자가 가장 먼저
 * 확인해야 할 기본 진입 박스라 문서함 '/approval/box' → pending 리다이렉트와 동일 근거다.
 * /messages/:box(received·sent·drafts·trash 4종)는 단일 동적 라우트이며, box 값 파싱·유효성
 * 검사는 문서함 tab 컨벤션과 동일하게 MessageBoxPage 내부(T2.2)에서 처리하므로 라우트 자체는
 * 게이팅하지 않는다. 상세/작성은 별도 라우트가 아니다 — 카드 내 뷰 전환으로 처리한다(채팅 오버레이와
 * 동일 철학). 'messages'(1세그먼트)와 'messages/:box'(2세그먼트)는 세그먼트 깊이가 달라 랭킹 충돌이
 * 없다. 전 항목 minRole EMPLOYEE라 별도 RoleGuard 없이 ProtectedRoute(인증 가드)만으로 충분하다.
 * /franchises·/franchises/:franchiseId·/franchise-educations·
 * /franchise-educations/:educationId·/franchise-inquiries·/franchise-inquiries/:inquiryId는
 * ROADMAP(FRANCHISE) T1.2에서 franchise 도메인 페이지 7종(FranchiseListPage/P1·F1601·F1603,
 * FranchiseDetailPage/P2·F1602·F1604~F1608, FranchiseSalesPage/P3·F1624~F1626,
 * FranchiseEducationCalendarPage/P4·F1609·F1612, FranchiseEducationDetailPage/P5·F1610·F1611·
 * F1613~F1616, FranchiseInquiryListPage/P6·F1617, FranchiseInquiryDetailPage/P7·F1618~F1623)로
 * 연결했다(근거: PRD docs/prd/16.franchise-prd.md §메뉴 구조·§페이지별 상세). 'franchises'·
 * 'franchise-educations'·'franchise-inquiries'는 각각 1세그먼트 정적 라우트이고 대응하는
 * ':franchiseId'·':educationId'·':inquiryId' 동적 라우트는 2세그먼트라 세그먼트 깊이가 달라 랭킹
 * 충돌이 없지만, 위 기안·회의 라우트들과 동일 컨벤션으로 정적 세그먼트를 각자의 동적 페어보다 앞에
 * 등록해 둔다(가독성·명시성 목적). 'franchise-sales'는 대응하는 동적 페어가 없는 단일 정적 라우트다
 * (P3, 가맹점은 페이지 내부의 FranchisePicker로 선택하되 `?franchiseId=` 쿼리 프리필도 소비한다 —
 * T2.3이 확정한 계약, FranchiseDetailPage [매출 조회] 버튼 참조). 전 7개
 * 라우트는 최소 요구 role이 FRANCHISE(ADMIN 자동 포함, RoleHierarchy)이지만, meeting FACILITY 그룹·
 * leaves/dept DEPT_MANAGER 컨벤션과 동일하게 role 게이팅은 사이드바(minRole)에서만 처리하고 라우트
 * 자체는 ProtectedRoute(인증 가드)만 적용한다 — 최종 권한 판단은 서버(403)에 위임한다. 각 상세
 * 페이지 내부의 소유자/상태 조건(교육 등록자·비활성+신청자 0, 답변 담당자 등)도 서버 최종 판단이며
 * 라우트 가드 범위 밖이다(PRD §권한 분기점). 7개 페이지는 전부 T2~T5 후속 태스크가 실 UI/데이터
 * 로직을 채우는 셸 상태다.
 * /schedules는 ROADMAP(SCHEDULE) T1.5에서 ScheduleCalendarPage(일정 캘린더 조회 페이지)로
 * 연결했다. minRole EMPLOYEE라 별도 RoleGuard 없이 ProtectedRoute(인증 가드)만으로 충분하다.
 * /employees/new는 인사관리(가입승인) 도메인 M1(T1.6)에서 NewEmployeeApprovalListPage(신규 사원
 * 승인 목록 페이지)로 연결했다. 정적 세그먼트 'new'는 React Router 7 랭킹 규칙상 동적
 * ':empId'보다 항상 우선 매칭되지만(위 'boards/new'·'drafts/new' 등과 동일 근거), 명시적으로도
 * 'employees/:empId'보다 앞에 등록해 둔다. 다이얼로그 연결(승인 확정 액션)은 M2(T2.5) 소관이라
 * 이 라우트는 목록 조회 화면만 배선한다. minRole HR 게이팅은 사이드바(minRole)에서만 처리하고
 * (근태 /attendance/dept·휴가·회의실 컨벤션과 동일), 라우트 자체는 ProtectedRoute(인증 가드)만
 * 적용한다 — 최종 권한 판단은 서버(403 ROLE_003)에 위임한다.
 * /employees는 인사관리 도메인에서 EmpManagementListPage(전사 사원 조회+관리, HR/ADMIN 전용)로
 * 연결했다. 행 클릭은 페이지 이동이 아니라 우측 오버레이 시트(EmpManagementSheet)를 열므로 하위
 * 라우트가 없다. 1세그먼트 정적 라우트라 위 'employees/new'·'employees/:empId'(둘 다 2세그먼트)와
 * 랭킹 충돌이 없다. minRole HR 게이팅은 사이드바에서만 처리하고, 라우트 자체는 ProtectedRoute
 * (인증 가드)만 적용한다 — 최종 권한 판단은 서버(403 ROLE_003)에 위임한다.
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
        // 홈 대시보드: adapt-ui(2026-07-12)에서 Ubold 레퍼런스(localhost:5174/apps/groupware/dashboard)
        // 이식 결과인 HomePage로 placeholder를 교체했다(src/features/home/pages/HomePage.tsx 상단
        // JSDoc 참조 — 역할별 위젯 분리 근거).
        index: true,
        element: <HomePage />,
      },
      {
        path: 'departments',
        element: <DepartmentsExplorerLayout />,
        children: [
          { index: true, element: <DepartmentExplorerEmptyState /> },
          { path: ':deptId', element: <DepartmentDetailPage /> },
        ],
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
        // 사원 관리 목록 페이지: 인사관리 도메인에서 EmpManagementListPage(전사 사원 조회+관리,
        // 오버레이 시트 방식)로 연결했다. 'employees'(1세그먼트, 정적)는 'employees/new'·
        // 'employees/:empId'(둘 다 2세그먼트)와 세그먼트 깊이가 달라 랭킹 충돌이 없다. 행 클릭 시
        // 페이지 이동 없이 EmpManagementSheet가 열리므로 이 라우트 자체에는 하위 라우트가 없다.
        // minRole HR 게이팅은 사이드바(minRole)에서만 처리하고(신규 사원 승인 등 기존 인사관리
        // 컨벤션과 동일), 라우트 자체는 ProtectedRoute(인증 가드)만 적용한다 — 최종 권한 판단은
        // 서버(403 ROLE_003)에 위임한다.
        path: 'employees',
        element: <EmpManagementListPage />,
      },
      {
        // 신규 사원 승인 목록 페이지: 인사관리(가입승인) 도메인 M1(T1.6)에서
        // NewEmployeeApprovalListPage로 연결했다. 정적 세그먼트 'new'는 동적 ':empId'보다 항상
        // 우선 매칭되지만(위 기안 라우트들과 동일 근거), 명시적으로도 앞에 등록해 둔다.
        path: 'employees/new',
        element: <NewEmployeeApprovalListPage />,
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
        // 취소 기안 작성 페이지(F704): 상세 [취소 기안 작성] 액션이 모달 대신 이 전용 페이지로
        // 이동한다(사용자 요청 2026-07-14). :draftId는 취소 대상 원본 기안이다. 'edit'와 동일한
        // 4세그먼트지만 마지막 리터럴('cancellation' vs 'edit')로 구분되어 랭킹 충돌이 없다.
        path: 'approval/drafts/:draftId/cancellation',
        element: <CancellationDraftCreatePage />,
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
      {
        // 내 예약 캘린더 페이지(P1): ROADMAP(MEETING-ROOMS) M1(T1.4)에서
        // MyMeetingCalendarPage(F800)로 연결했다. minRole EMPLOYEE라 ProtectedRoute(인증 가드)만으로
        // 충분하다. 사이드바 "회의실 예약" 항목의 실제 진입점이다.
        path: 'meetings',
        element: <MyMeetingCalendarPage />,
      },
      {
        // 회의 예약 생성 페이지(P2): ROADMAP(MEETING-ROOMS) M3(T3.3-b)에서
        // MeetingReservationCreatePage(F802·F803)로 연결했다. 정적 세그먼트라 동적
        // 'meetings/:meetingId'보다 항상 우선 매칭되지만(위 기안 라우트들과 동일 근거), 명시적으로도
        // ':meetingId'보다 앞에 등록해 둔다.
        path: 'meetings/new',
        element: <MeetingReservationCreatePage />,
      },
      {
        // 회의 예약 관리 페이지(P5, FACILITY 조회 전용): ROADMAP(MEETING-ROOMS) M5(T5.2)에서
        // MeetingReservationManagementPage(F810)로 연결했다. ①'meetings/new'와 동일 근거로 정적
        // 세그먼트를 동적 'meetings/:meetingId'보다 앞에 등록해 둔다. minRole FACILITY 게이팅은
        // 사이드바에서 처리하고(근태 /attendance/dept 컨벤션 동일), 라우트 자체는 ProtectedRoute(인증
        // 가드)만 적용한다 — 최종 권한 판단은 서버(403 ROLE_003).
        path: 'meetings/management',
        element: <MeetingReservationManagementPage />,
      },
      {
        // 회의실 관리 목록 페이지(P6, FACILITY): ROADMAP(MEETING-ROOMS) M6(T6.3-b)에서
        // MeetingRoomManagementPage(F811·F812·F814)로 연결했다. 정적 세그먼트라 동적
        // 'meeting-rooms/:meetingRoomId'보다 항상 우선 매칭되지만, 명시적으로도 앞에 등록해 둔다.
        // minRole FACILITY 게이팅은 사이드바에서 처리하고, 라우트 자체는 ProtectedRoute(인증 가드)만
        // 적용한다 — 최종 권한 판단은 서버(403 ROLE_003).
        path: 'meeting-rooms/management',
        element: <MeetingRoomManagementPage />,
      },
      {
        // 회의실 상세(열람) 페이지(P4): ROADMAP(MEETING-ROOMS) M2(T2.4-b)에서
        // MeetingRoomDetailPage(F807~F809)로 연결했다. 위 'meeting-rooms/management'(정적 세그먼트)
        // 보다 뒤에 등록해 랭킹 충돌을 피한다. minRole EMPLOYEE라 ProtectedRoute(인증 가드)만으로
        // 충분하다.
        path: 'meeting-rooms/:meetingRoomId',
        element: <MeetingRoomDetailPage />,
      },
      {
        // 회의실 관리 상세 페이지(P7, FACILITY): ROADMAP(MEETING-ROOMS) M7(T7.2-c)에서
        // MeetingRoomManagementDetailPage(F813·F815·F816·F814)로 연결했다. 3세그먼트라
        // 'meeting-rooms/management'(2세그먼트)와 랭킹 충돌이 없다. minRole FACILITY 게이팅은
        // 사이드바에서 처리하고, 라우트 자체는 ProtectedRoute(인증 가드)만 적용한다 — 최종 권한
        // 판단은 서버(403 ROLE_003).
        path: 'meeting-rooms/management/:meetingRoomId',
        element: <MeetingRoomManagementDetailPage />,
      },
      {
        // 일정 캘린더 페이지: ROADMAP(SCHEDULE) T1.5에서 ScheduleCalendarPage로 연결했다. minRole
        // EMPLOYEE라 별도 RoleGuard 없이 ProtectedRoute(인증 가드)만으로 충분하다 — 사이드바
        // "일정/회의 > 일정 캘린더" 항목의 실제 진입점이다.
        path: 'schedules',
        element: <ScheduleCalendarPage />,
      },
      {
        // 쪽지함 인덱스: 세그먼트 없이 접근 시 기본 박스(받은 쪽지함)로 리다이렉트한다. 문서함
        // '/approval/box' 인덱스 리다이렉트(위 참고)와 동일 컨벤션이다.
        path: 'messages',
        element: <Navigate to="/messages/received" replace />,
      },
      {
        // 쪽지함 통합 페이지: 받은/보낸/임시저장/휴지통 4박스를 MessageBoxPage 하나로 통합한
        // 단일 동적 라우트다(ROADMAP(MESSAGE) T1.3). box 값 파싱·유효성 검사는 문서함 tab 컨벤션과
        // 동일하게 컴포넌트 내부(T2.2)에서 처리하므로 라우트는 게이팅하지 않는다.
        path: 'messages/:box',
        element: <MessageBoxPage />,
      },
      {
        // 가맹점 목록 페이지(P1): ROADMAP(FRANCHISE) T1.2에서 FranchiseListPage(F1601·F1603)로
        // 연결했다. 사이드바 "가맹점 > 가맹점 관리" 항목의 실제 진입점이다.
        path: 'franchises',
        element: <FranchiseListPage />,
      },
      {
        // 가맹점 상세 페이지(P2): ROADMAP(FRANCHISE) T1.2에서 FranchiseDetailPage(F1602·
        // F1604~F1608)로 연결했다. 위 'franchises'(1세그먼트, 정적)보다 뒤에 등록해 랭킹 충돌을
        // 피한다. 목록 페이지의 행 클릭 이동이 실제 상세 화면으로 이어진다.
        path: 'franchises/:franchiseId',
        element: <FranchiseDetailPage />,
      },
      {
        // 가맹점 교육 캘린더 페이지(P4): ROADMAP(FRANCHISE) T1.2에서
        // FranchiseEducationCalendarPage(F1609·F1612)로 연결했다. 사이드바 "가맹점 > 가맹점 교육"
        // 항목의 실제 진입점이다.
        path: 'franchise-educations',
        element: <FranchiseEducationCalendarPage />,
      },
      {
        // 가맹점 교육 등록 페이지(F1612): 사용자 요청(2026-07-13 UI 개편)으로 등록 다이얼로그를
        // 전용 페이지로 전환하며 추가했다. 아래 'franchise-educations/:educationId'(2세그먼트,
        // 동적)와 세그먼트 깊이가 같으므로 정적 'new'를 동적 페어보다 앞에 등록해 랭킹 모호성을
        // 피한다(기존 도메인 컨벤션 동형). 캘린더 페이지 [교육 등록] 버튼의 이동 목적지다.
        path: 'franchise-educations/new',
        element: <FranchiseEducationCreatePage />,
      },
      {
        // 가맹점 교육 상세 페이지(P5): ROADMAP(FRANCHISE) T1.2에서
        // FranchiseEducationDetailPage(F1610·F1611·F1613~F1616)로 연결했다. 위
        // 'franchise-educations'(1세그먼트, 정적)·'franchise-educations/new'(2세그먼트, 정적)보다
        // 뒤에 등록해 랭킹 충돌을 피한다. 캘린더 이벤트 클릭·교육 등록 성공 직후의 이동 목적지다.
        path: 'franchise-educations/:educationId',
        element: <FranchiseEducationDetailPage />,
      },
      {
        // 가맹점 문의 목록 페이지(P6): ROADMAP(FRANCHISE) T1.2에서 FranchiseInquiryListPage(F1617)로
        // 연결했다. 사이드바 "가맹점 > 가맹점 문의" 항목의 실제 진입점이다.
        path: 'franchise-inquiries',
        element: <FranchiseInquiryListPage />,
      },
      {
        // 가맹점 문의 상세 페이지(P7): ROADMAP(FRANCHISE) T1.2에서
        // FranchiseInquiryDetailPage(F1618~F1623)로 연결했다. 위 'franchise-inquiries'(1세그먼트,
        // 정적)보다 뒤에 등록해 랭킹 충돌을 피한다. 목록 페이지의 행 클릭 이동이 실제 상세 화면으로
        // 이어진다.
        path: 'franchise-inquiries/:inquiryId',
        element: <FranchiseInquiryDetailPage />,
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
  {
    path: '/approval/drafts/:draftId/print',
    element: (
      <ProtectedRoute>
        <DraftPrintPreviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/approval/drafts/preview',
    element: (
      <ProtectedRoute>
        <DraftCreatePreviewPage />
      </ProtectedRoute>
    ),
  },
])
