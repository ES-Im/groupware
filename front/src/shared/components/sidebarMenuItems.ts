import {
  CalendarDays,
  ClipboardList,
  Clock,
  FileSignature,
  Home,
  Mail,
  Network,
  Notebook,
  Palmtree,
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
    // 전자결재 그룹: M1(T1.7)에서 문서함 4종(상신/임시저장/결재대기/결재함) 실 라우트로 교체했다.
    // 문서함 홈은 M7(T7.3)에서 DocumentBoxHomePage(F715 요약 카드·F711 결재대기 강조)로 live 승격했다.
    // 결재대기함은 badgeKey('approvalPending')로 F711 결재대기 건수 뱃지 슬롯을 선언한다 — 실제
    // count는 LayoutShell이 useMyPendingApprovalDraftsCountQuery로 조회해 주입한다.
    label: '전자결재',
    minRole: 'EMPLOYEE',
    icon: FileSignature,
    children: [
      { label: '문서함 홈', to: '/approval/box/home', minRole: 'EMPLOYEE' },
      { label: '상신함', to: '/approval/box/submitted', minRole: 'EMPLOYEE' },
      { label: '임시저장함', to: '/approval/box/unsubmitted', minRole: 'EMPLOYEE' },
      {
        label: '결재대기함',
        to: '/approval/box/pending',
        minRole: 'EMPLOYEE',
        badgeKey: 'approvalPending',
      },
      { label: '결재함', to: '/approval/box/accessible', minRole: 'EMPLOYEE' },
    ],
  },
  {
    label: '일정/회의',
    minRole: 'EMPLOYEE',
    icon: CalendarDays,
    children: [
      { label: '일정 캘린더', minRole: 'EMPLOYEE', implemented: false },
      { label: '회의실 예약', minRole: 'EMPLOYEE', implemented: false },
      { label: '회의실 관리', minRole: 'FACILITY', implemented: false },
    ],
  },
  {
    label: '게시판/쪽지',
    minRole: 'EMPLOYEE',
    icon: Notebook,
    children: [
      { label: '게시판', to: '/boards', minRole: 'EMPLOYEE', icon: ClipboardList },
      { label: '쪽지함', minRole: 'EMPLOYEE', icon: Mail, implemented: false },
    ],
  },
  {
    label: '휴가 관리',
    minRole: 'EMPLOYEE',
    icon: Palmtree,
    children: [
      { label: '내 휴가 요약', minRole: 'EMPLOYEE', implemented: false },
      { label: '부서 휴가 관리', minRole: 'DEPT_MANAGER', implemented: false },
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
    label: '가맹점',
    minRole: 'FRANCHISE',
    icon: Store,
    children: [
      { label: '가맹점 관리', minRole: 'FRANCHISE', implemented: false },
      { label: '가맹점 교육', minRole: 'FRANCHISE', implemented: false },
      { label: '가맹점 문의', minRole: 'FRANCHISE', implemented: false },
      { label: '가맹점 매출', minRole: 'FRANCHISE', implemented: false },
    ],
  },
]
