import {
  CalendarDays,
  Clock,
  Ellipsis,
  FileSignature,
  Home,
  Mail,
  Network,
  Notebook,
  Palmtree,
  Settings,
  Store,
  UserCog,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react'

/**
 * 사이드바 메뉴 선언적 트리(S2 복제 표준, ROADMAP T4.1 / 2번째 PRD §B-2).
 * 항목을 트리에 추가하기만 하면 Sidebar가 hasRequiredRole로 자동 게이팅한다(신규 도메인 메뉴 확장 슬롯).
 * minRole은 security.md 권한 계층의 역할 코드(ROLE_ 접두어 제외)다.
 *
 * 세 종류의 노드:
 * - 리프(구현됨): `to`가 있고 `implemented`가 기본값(true) → NavLink로 렌더.
 * - 리프(placeholder): `to`가 없고 `implemented: false` → 클릭 불가 "준비중" 비활성 렌더(고아 링크 원천 차단).
 * - 그룹: `children` 배열 보유 → 자체는 펼침/접힘 토글만 수행하고 라우팅하지 않는다.
 *
 * 아이콘은 lucide 컴포넌트를 데이터에 직접 참조한다(그룹은 `to`가 없어 경로 기준 매핑이 불가하므로).
 */
export interface SidebarMenuItem {
  label: string
  /** 그룹/placeholder는 실 라우트가 없어 생략한다. */
  to?: string
  minRole: string
  icon?: LucideIcon
  /** 존재하면 그룹 노드로 취급한다. */
  children?: SidebarMenuItem[]
  /** 기본 true. false면 비활성 placeholder("준비중")로 렌더한다. */
  implemented?: boolean
  /**
   * 뱃지 식별자(ROADMAP(DRAFT) T7.3). 정적 메뉴 트리에는 라이브 건수를 담을 수 없으므로,
   * 트리에는 이 식별자만 두고 실제 count는 LayoutShell이 도메인 훅으로 조회해
   * badgeCounts 맵(예 `{ approvalPending: 3 }`)으로 Sidebar에 주입한다(SidebarMenuLink가 조회해 렌더).
   */
  badgeKey?: string
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  // Layer 1 — 공통(전 사원 접근). 실 라우트로 연결된 구현 완료 항목.
  { label: '홈', to: '/', minRole: 'EMPLOYEE', icon: Home },
  // 조직도(전사 부서 디렉터리)와 부서 멤버 목록(본인 소속 부서 바로가기)은 서로 다른 화면 — PRD 메뉴 순서(홈 → 조직도 → 부서 멤버 목록)를 따른다.
  { label: '조직도', to: '/departments', minRole: 'EMPLOYEE', icon: Network },
  { label: '부서 멤버 목록', to: '/department-members', minRole: 'EMPLOYEE', icon: Users },
  { label: '내 정보', to: '/me', minRole: 'EMPLOYEE', icon: UserRound },
  // 쪽지함: ROADMAP(MESSAGE) T1.3에서 placeholder 없이 최상위 항목으로 신규 추가했다. badgeKey만
  // 선언하고 실제 미확인 건수 조회·주입은 LayoutShell(T1.4)이 담당한다(전자결재 결재대기 배지와
  // 동일 컨벤션 — 위 badgeKey 필드 주석 참고).
  { label: '쪽지함', to: '/messages', minRole: 'EMPLOYEE', icon: Mail, badgeKey: 'messageUnread' },

  // Layer 2 — 업무 도메인 그룹. 하위 항목은 아직 프론트 미구현이라 전부 placeholder("준비중").
  // IT 관리 그룹과 채팅은 제외한다(IT는 백엔드 계약 없음, 채팅은 ROADMAP 완전 제외).
  {
    label: '근태',
    minRole: 'EMPLOYEE',
    icon: Clock,
    children: [
      { label: '내 근태', to: '/attendance/me', minRole: 'EMPLOYEE' },
      { label: '부서 근태 승인', to: '/attendance/dept', minRole: 'DEPT_MANAGER' },
    ],
  },
  {
    // 전자결재 그룹: 상신함/임시저장함/결재대기함/결재함 4종 리프는 문서함 UI 통합 작업에서 단일
    // '문서함' 항목(/approval/box → 결재대기 탭으로 리다이렉트)으로 합쳤다 — 4종 목록은 이제
    // DocumentBoxHomePage 내부 탭 전환으로 대체된다. 결재대기함이 갖던 badgeKey('approvalPending',
    // F711 결재대기 건수 뱃지)는 '문서함' 항목으로 그대로 이전한다 — 실제 count는 LayoutShell이
    // useMyPendingApprovalDraftsCountQuery로 조회해 주입한다.
    // 새 기안 작성은 DRAFT-COMMON에서 GeneralDraftCreatePage(F720) 진입점으로 그룹 최상단에 추가했다.
    // 출장 기안 작성은 ROADMAP(DRAFT-BUSINESSTRIP) T1.4에서 새 기안 작성 옆에 추가했다.
    // 매출 기안 작성은 ROADMAP(SALES) M4(T4.1)에서 출장 기안 작성 옆에 추가했다. minRole
    // FRANCHISE(hasRequiredRole가 ADMIN 자동 포함 게이팅).
    // 내/부서 출장 이력은 문서함 UI 통합 작업에서 '[미배치]' 그룹으로 이동했다(아래 그룹 주석 참고).
    label: '전자결재',
    minRole: 'EMPLOYEE',
    icon: FileSignature,
    children: [
      { label: '새 기안 작성', to: '/approval/drafts/new', minRole: 'EMPLOYEE' },
      {
        label: '출장 기안 작성',
        to: '/approval/drafts/business-trips/new',
        minRole: 'EMPLOYEE',
      },
      {
        label: '매출 기안 작성',
        to: '/approval/drafts/sales/new',
        minRole: 'FRANCHISE',
      },
      {
        label: '문서함',
        to: '/approval/box',
        minRole: 'EMPLOYEE',
        badgeKey: 'approvalPending',
      },
    ],
  },
  {
    // [미배치] 그룹: 결재함(공람류)과 출장 이력류는 추후 별도 '부서관리' 탭으로 옮길 예정이라
    // 정식 그룹에 배치하지 않고 임시로 이 그룹에 둔다(문서함 UI 통합 작업). 전자결재 그룹의 형제로
    // 최상위 트리에 둔다.
    label: '[미배치]',
    minRole: 'EMPLOYEE',
    icon: Ellipsis,
    children: [
      {
        label: '내 출장 이력',
        to: '/approval/business-trips/me/history',
        minRole: 'EMPLOYEE',
      },
      {
        label: '부서 출장 이력',
        to: '/approval/business-trips/dept/history',
        minRole: 'DEPT_MANAGER',
      },
    ],
  },
  {
    // 일정/회의 그룹: '일정 캘린더'는 이 로드맵 범위 밖이라 placeholder를 유지한다(미터치).
    // '회의실 예약'·'회의실 관리'는 ROADMAP(MEETING-ROOMS) M8(T8.1)에서 placeholder→실 라우트로
    // 승격했고, '회의 예약 관리'(FACILITY 조회 전용, F810)를 신규 추가했다. franchise 그룹의
    // minRole:'FRANCHISE' 게이팅 선례와 동일하게 minRole:'FACILITY'도 hasRequiredRole이 ADMIN을
    // 자동 포함한다.
    label: '일정/회의',
    minRole: 'EMPLOYEE',
    icon: CalendarDays,
    children: [
      { label: '일정 캘린더', minRole: 'EMPLOYEE', implemented: false },
      { label: '회의실 예약', to: '/meetings', minRole: 'EMPLOYEE' },
      { label: '회의실 관리', to: '/meeting-rooms/management', minRole: 'FACILITY' },
      { label: '회의 예약 관리', to: '/meetings/management', minRole: 'FACILITY' },
    ],
  },
  // 게시판: 원래 '게시판/쪽지' 그룹이었으나 쪽지함이 최상위로 승격되며 자식이 게시판 하나만
  // 남아, 자식 1개짜리 그룹(불필요한 펼침/접힘 계층)을 최상위 단일 링크로 평탄화했다
  // (ux-ui-stylist, 2026-07-11). 아이콘은 그룹이 쓰던 Notebook을 그대로 유지한다.
  { label: '게시판', to: '/boards', minRole: 'EMPLOYEE', icon: Notebook },
  {
    // 휴가 관리 그룹: ROADMAP(LEAVE) M6(T6.1)에서 placeholder 2개를 실 라우트로 승격하고 관리자
    // 휴가 현황 항목을 신규 추가했다. '내 휴가 요약'은 잔여+이력을 함께 다루므로 라벨을 '내 휴가'로
    // 조정했다. 결재대기함은 이미 '전자결재' 그룹에 있으므로 여기 추가하지 않는다(PRD §메뉴 구조).
    label: '휴가 관리',
    minRole: 'EMPLOYEE',
    icon: Palmtree,
    children: [
      { label: '내 휴가', to: '/leaves/me', minRole: 'EMPLOYEE' },
      { label: '부서 휴가 관리', to: '/leaves/dept', minRole: 'DEPT_MANAGER' },
      { label: '관리자 휴가 현황', to: '/leaves/admin', minRole: 'ADMIN' },
    ],
  },
  {
    label: '인사관리',
    minRole: 'HR',
    icon: UserCog,
    children: [
      { label: '신규 사원 승인', minRole: 'HR', implemented: false },
      { label: '사원 상태 관리', minRole: 'HR', implemented: false },
    ],
  },
  {
    // 가맹점 그룹: ROADMAP(FRANCHISE) T1.2에서 placeholder 4개를 실 라우트로 승격했다. minRole
    // FRANCHISE는 그룹·자식 모두 그대로 유지한다(hasRequiredRole이 ADMIN을 자동 포함, meeting
    // FACILITY 그룹 선례 동형).
    label: '가맹점',
    minRole: 'FRANCHISE',
    icon: Store,
    children: [
      { label: '가맹점 관리', to: '/franchises', minRole: 'FRANCHISE' },
      { label: '가맹점 교육', to: '/franchise-educations', minRole: 'FRANCHISE' },
      { label: '가맹점 문의', to: '/franchise-inquiries', minRole: 'FRANCHISE' },
      { label: '가맹점 매출', to: '/franchise-sales', minRole: 'FRANCHISE' },
    ],
  },
  {
    // 설정 그룹: ROADMAP(COMPANY) T1.3에서 신규 추가. 그룹·리프 모두 minRole ADMIN이라 사이드바에는
    // ADMIN에게만 노출되지만, 실제 라우트(/settings/company) 가드는 EMPLOYEE 수준이다 — 조회 API가
    // permitAll이라 비-ADMIN이 URL을 직접 입력해도 읽기 전용 뷰가 정상 렌더되어야 하므로 의도된
    // 비대칭이다(router.tsx 주석 참고).
    label: '설정',
    minRole: 'ADMIN',
    icon: Settings,
    children: [{ label: '회사 정보', to: '/settings/company', minRole: 'ADMIN' }],
  },
]
