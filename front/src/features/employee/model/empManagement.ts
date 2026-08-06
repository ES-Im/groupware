export type EmpStatus = 'PENDING' | 'ACTIVE' | 'RESIGNED' | 'SUSPENDED'

export type SystemRoleCode = 'EMPLOYEE' | 'DEPT_MANAGER' | 'ADMIN' | 'FRANCHISE' | 'IT' | 'HR' | 'FACILITY'

export interface EmpBelonging {
  deptId: number
  deptCode: string
  deptName: string
  positionName: string
  isPrimary: boolean
  startAt: string
  endAt: string | null
}

export interface EmpManagementRecord {
  empId: number
  empNo: string
  empName: string
  loginId: string
  email: string
  extensionNo: string | null
  status: EmpStatus
  hireAt: string
  resignAt: string | null
  belongings: EmpBelonging[]
  systemRoleCodeName: SystemRoleCode[]
}

export interface EmpManagementListParams {
  deptId?: number
  status?: EmpStatus
  keyword?: string
  page?: number
  size?: number
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type EmpManagementPage = Page<EmpManagementRecord>

export const empStatusLabels: Record<EmpStatus, string> = {
  PENDING: '가입 대기',
  ACTIVE: '재직중',
  RESIGNED: '퇴직',
  SUSPENDED: '정직',
}

export const systemRoleLabels: Record<SystemRoleCode, string> = {
  EMPLOYEE: '일반',
  DEPT_MANAGER: '부서관리자',
  ADMIN: '시스템관리자',
  FRANCHISE: '프랜차이즈',
  IT: 'IT',
  HR: '인사',
  FACILITY: '시설',
}

export const LAYER2_ROLE_CODES: SystemRoleCode[] = ['FRANCHISE', 'IT', 'HR', 'FACILITY']

type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export const empStatusBadgeVariant: Record<EmpStatus, StatusBadgeVariant> = {
  ACTIVE: 'default',
  PENDING: 'outline',
  SUSPENDED: 'destructive',
  RESIGNED: 'secondary',
}

export const systemRoleBadgeVariant: Record<SystemRoleCode, StatusBadgeVariant> = {
  ADMIN: 'default',
  DEPT_MANAGER: 'secondary',
  EMPLOYEE: 'outline',
  FRANCHISE: 'outline',
  IT: 'outline',
  HR: 'outline',
  FACILITY: 'outline',
}
