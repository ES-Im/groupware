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

export interface SidebarMenuItem {
  label: string
  to?: string
  minRole: string
  icon?: LucideIcon
  children?: SidebarMenuItem[]
  implemented?: boolean
  badgeKey?: string
  section?: string
}

export const sidebarMenuItems: SidebarMenuItem[] = [
  { label: '홈', to: '/', minRole: 'EMPLOYEE', icon: Home },

  { label: '내 정보', to: '/me', minRole: 'EMPLOYEE', icon: UserRound, section: '개인' },

  { label: '일정 캘린더', to: '/schedules', minRole: 'EMPLOYEE', icon: CalendarDays, section: '개인' },

  {
    label: '쪽지함',
    to: '/messages',
    minRole: 'EMPLOYEE',
    icon: Mail,
    badgeKey: 'messageUnread',
    section: '소통',
  },

  { label: '게시판', to: '/boards', minRole: 'EMPLOYEE', icon: Notebook, section: '소통' },

  {
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

    label: '회의',
    minRole: 'EMPLOYEE',
    icon: Presentation,
    section: '업무',
    children: [
      { label: '회의실 예약', to: '/meetings', minRole: 'EMPLOYEE' },
      { label: '예약 관리', to: '/meetings/management', minRole: 'FACILITY' },
    ],
  },

  {
    label: '부서관리',
    minRole: 'DEPT_MANAGER',
    icon: Users,
    section: '관리',
    children: [
      { label: '부서 멤버 목록', to: '/department-members', minRole: 'DEPT_MANAGER' },
      { label: '부서 휴가 관리', to: '/leaves/dept', minRole: 'DEPT_MANAGER' },
      { label: '부서 출장 이력', to: '/approval/business-trips/dept/history', minRole: 'DEPT_MANAGER' },
      { label: '부서 근태 승인', to: '/attendance/dept', minRole: 'DEPT_MANAGER' },
    ],
  },
  {
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
    label: '시설관리',
    minRole: 'FACILITY',
    icon: Building2,
    section: '관리',
    children: [{ label: '회의실 관리', to: '/meeting-rooms/management', minRole: 'FACILITY' }],
  },
  {
    label: '관리자',
    minRole: 'ADMIN',
    icon: Settings,
    section: '관리',
    children: [
      { label: '조직 관리', to: '/departments', minRole: 'ADMIN' },
      { label: '휴가 관리', to: '/leaves/admin', minRole: 'ADMIN' },
      { label: '회사 관리', to: '/settings/company', minRole: 'ADMIN' },
    ],
  },
]
