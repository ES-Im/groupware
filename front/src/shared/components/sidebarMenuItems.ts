import {
  Building2,
  CalendarDays,
  FileSignature,
  Home,
  Mail,
  Notebook,
  Presentation,
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
  /**
   * 최상위 노드 전용 섹션 라벨(사용자 확정, 2026-07-13). 값이 이전 최상위 노드와 다르면 Sidebar가
   * 그 앞에 섹션 헤더(제목 + 절취선, SidebarSectionHeader)를 렌더한다. undefined면 어떤 섹션에도
   * 속하지 않는다('홈'처럼 최상단에 단독으로 노출). 최상위가 아닌 children에는 의미가 없다.
   */
  section?: string
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  // 홈은 어떤 섹션에도 속하지 않고 최상단에 단독으로 노출한다.
  { label: '홈', to: '/', minRole: 'EMPLOYEE', icon: Home },

  // 개인 섹션: 본인 정보·일정 조회.
  { label: '내 정보', to: '/me', minRole: 'EMPLOYEE', icon: UserRound, section: '개인' },
  // 일정 캘린더: '일정/회의' 그룹에서 최상위로 승격했다(사용자 확정, 2026-07-13).
  // 아이콘은 그룹이 쓰던 CalendarDays를 그대로 유지한다.
  { label: '일정 캘린더', to: '/schedules', minRole: 'EMPLOYEE', icon: CalendarDays, section: '개인' },

  // 소통 섹션: 쪽지·게시판.
  // 쪽지함: ROADMAP(MESSAGE) T1.3에서 placeholder 없이 최상위 항목으로 신규 추가했다. badgeKey만
  // 선언하고 실제 미확인 건수 조회·주입은 LayoutShell(T1.4)이 담당한다(전자결재 결재대기 배지와
  // 동일 컨벤션 — 위 badgeKey 필드 주석 참고).
  {
    label: '쪽지함',
    to: '/messages',
    minRole: 'EMPLOYEE',
    icon: Mail,
    badgeKey: 'messageUnread',
    section: '소통',
  },
  // 게시판: 원래 '게시판/쪽지' 그룹이었으나 쪽지함이 최상위로 승격되며 자식이 게시판 하나만
  // 남아, 자식 1개짜리 그룹(불필요한 펼침/접힘 계층)을 최상위 단일 링크로 평탄화했다
  // (ux-ui-stylist, 2026-07-11). 아이콘은 그룹이 쓰던 Notebook을 그대로 유지한다.
  { label: '게시판', to: '/boards', minRole: 'EMPLOYEE', icon: Notebook, section: '소통' },

  // 업무 섹션: 전자결재·회의(둘 다 그룹).
  // 근태: '내 근태'는 MyInfoPage의 "개인 기록 조회" 위젯 오버레이로, '부서 근태 승인'은 '부서관리'
  // 그룹으로 이동했다(2026-07-13). 라우트(/attendance/me, /attendance/dept)는 둘 다 유지한다.
  {
    // 전자결재 그룹은 '결재함'과 '새 기안 작성' 딱 2개만 둔다(사용자 확정, 2026-07-10).
    // 유형별 작성 항목(출장/연가/매출)은 메뉴에서 제거했다 — 작성 화면(DraftCreateFrame)의
    // 좌측 "기안서 종류" 카드가 4종 전환을 담당하므로 진입점은 '새 기안 작성' 하나로 충분하다.
    // '결재함'(/approval/box → 결재대기 탭 리다이렉트)은 4종 문서함을 DocumentBoxHomePage 내부
    // 탭으로 통합한 단일 진입점이며, 결재대기 건수 badgeKey('approvalPending', F711)는 LayoutShell이
    // useMyPendingApprovalDraftsCountQuery로 조회해 주입한다.
    // 내 출장 이력은 MyInfoPage 위젯 오버레이로, 부서 출장 이력은 '부서관리' 그룹으로 이동했다.
    label: '전자결재',
    minRole: 'EMPLOYEE',
    icon: FileSignature,
    section: '업무',
    children: [
      {
        label: '결재함',
        to: '/approval/box',
        minRole: 'EMPLOYEE',
        badgeKey: 'approvalPending',
      },
      { label: '새 기안 작성', to: '/approval/drafts/new', minRole: 'EMPLOYEE' },
    ],
  },
  {
    // 회의 그룹(구 '일정/회의'): '일정 캘린더'는 최상위로 승격했고, '회의실 관리'는
    // '시설관리' 그룹으로 이동했다(2026-07-13). 남은 두 항목(회의실 예약·회의 예약 관리)만으로
    // 그룹명을 '회의'로 정정하고, 그룹 접두어와 중복되는 '회의 예약 관리'는 '예약 관리'로
    // 축약했다. 그룹 자체의 minRole은 자식 중 가장 낮은 권한(EMPLOYEE)으로 둔다(다른 그룹과
    // 동일 선례 패턴) — 예약 관리(FACILITY)는 hasRequiredRole이 ADMIN을 자동 포함한다.
    label: '회의',
    minRole: 'EMPLOYEE',
    icon: Presentation,
    section: '업무',
    children: [
      { label: '회의실 예약', to: '/meetings', minRole: 'EMPLOYEE' },
      { label: '예약 관리', to: '/meetings/management', minRole: 'FACILITY' },
    ],
  },

  // 관리 섹션: 부서·인사·가맹점·시설·관리자 5개 그룹.
  {
    // 부서관리 그룹(사용자 확정, 2026-07-13): 이미 존재하던 부서 멤버 목록·부서 휴가 관리·부서
    // 출장 이력·부서 근태 승인 4개 뷰를 한데 묶은 순수 배치 이동이다. 그룹 자체의 minRole은 자식
    // 중 가장 낮은 권한(EMPLOYEE)으로 둔다 — 다른 관리 섹션 그룹과 동일한 선례 패턴이며, 각 자식은
    // 기존 개별 minRole을 그대로 유지해 열람 권한에 변화가 없다(부서 멤버 목록은 전 사원, 나머지
    // 셋은 DEPT_MANAGER·ADMIN 자동 포함).
    label: '부서관리',
    minRole: 'EMPLOYEE',
    icon: Users,
    section: '관리',
    children: [
      { label: '부서 멤버 목록', to: '/department-members', minRole: 'EMPLOYEE' },
      { label: '부서 휴가 관리', to: '/leaves/dept', minRole: 'DEPT_MANAGER' },
      { label: '부서 출장 이력', to: '/approval/business-trips/dept/history', minRole: 'DEPT_MANAGER' },
      { label: '부서 근태 승인', to: '/attendance/dept', minRole: 'DEPT_MANAGER' },
    ],
  },
  {
    // 인사관리 그룹(ADMIN, HR — 사용자 확정, 2026-07-13): minRole:'HR'는 이미 ROLE_HIERARCHY상
    // ADMIN을 자동 포함하므로(hasRequiredRole.ts) 별도 변경 없이 두 역할 모두 노출된다.
    // '사원 관리'는 EmpManagementListPage(/employees) 구현으로 placeholder를 실 라우트로 승격했다.
    label: '인사관리',
    minRole: 'HR',
    icon: UserCog,
    section: '관리',
    children: [
      { label: '신규 사원 승인', to: '/employees/new', minRole: 'HR' },
      { label: '사원 관리', to: '/employees', minRole: 'HR' },
    ],
  },
  {
    // 가맹점 그룹: ROADMAP(FRANCHISE) T1.2에서 placeholder 4개를 실 라우트로 승격했다. minRole
    // FRANCHISE는 그룹·자식 모두 그대로 유지한다(hasRequiredRole이 ADMIN을 자동 포함, meeting
    // FACILITY 그룹 선례 동형).
    label: '가맹점',
    minRole: 'FRANCHISE',
    icon: Store,
    section: '관리',
    children: [
      { label: '가맹점 관리', to: '/franchises', minRole: 'FRANCHISE' },
      { label: '가맹점 교육', to: '/franchise-educations', minRole: 'FRANCHISE' },
      { label: '가맹점 문의', to: '/franchise-inquiries', minRole: 'FRANCHISE' },
    ],
  },
  {
    // 시설관리 그룹(FACILITY, ADMIN — 사용자 확정, 2026-07-13): '일정/회의' 그룹에 있던 '회의실
    // 관리'를 이 그룹으로 이동한 순수 배치 이동이다. 자식이 1개뿐이지만 사용자가 명시적으로
    // "그룹 생성"을 요청해, 다른 그룹들의 "자식 1개→최상위 평탄화" 관례를 이번엔 적용하지 않는다
    // (추후 시설 관련 항목이 늘어날 확장 여지로 보인다). '회의 예약 관리'(FACILITY)는 이동 대상으로
    // 지목되지 않아 '회의' 그룹에 그대로 남긴다.
    label: '시설관리',
    minRole: 'FACILITY',
    icon: Building2,
    section: '관리',
    children: [{ label: '회의실 관리', to: '/meeting-rooms/management', minRole: 'FACILITY' }],
  },
  {
    // 관리자 그룹(사용자 확정, 2026-07-13): 이미 존재하던 조직도·관리자 휴가 현황·설정(회사 정보)
    // 3개 뷰를 한데 묶은 순수 배치 이동이다(라벨은 각각 조직 관리/휴가 관리/회사 관리로 재명명).
    // 그룹 자체의 minRole은 자식 중 가장 낮은 권한(EMPLOYEE)으로 둔다 — 다른 관리 섹션 그룹과
    // 동일한 선례 패턴이며, 조직 관리(EMPLOYEE, 전사 부서 디렉터리 조회)는 기존처럼 전 사원이
    // 계속 볼 수 있고, 휴가 관리·회사 관리(ADMIN)만 관리자에게 노출된다.
    // 회사 관리(/settings/company)는 실제 라우트 가드가 EMPLOYEE 수준이다 — 조회 API가 permitAll이라
    // 비-ADMIN이 URL을 직접 입력해도 읽기 전용 뷰가 정상 렌더되어야 하므로 의도된 비대칭이다
    // (router.tsx 주석 참고, 사이드바 메뉴 노출만 ADMIN으로 좁힌다).
    label: '관리자',
    minRole: 'EMPLOYEE',
    icon: Settings,
    section: '관리',
    children: [
      { label: '조직 관리', to: '/departments', minRole: 'EMPLOYEE' },
      { label: '휴가 관리', to: '/leaves/admin', minRole: 'ADMIN' },
      { label: '회사 관리', to: '/settings/company', minRole: 'ADMIN' },
    ],
  },
]
