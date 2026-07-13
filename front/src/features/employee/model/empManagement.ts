/**
 * 관리용 사원 리스트 조회(`EMPS_FOR_MANAGEMENT`, GET /api/employees) 응답/요청 타입.
 * 필드는 back/build/generated-snippets/EMPS_FOR_MANAGEMENT/response-fields.adoc 실측 기준(추측 금지).
 * DEPT_MEMBERS(deptMember.ts)와 달리 status/hireAt/resignAt/belongings/systemRoleCodeName을
 * 포함한다 — HR/DEPT_MANAGER/ADMIN이 부서원 정보를 관리(수정)할 때만 필요한 확장 필드라 별도
 * 엔드포인트·별도 모델로 분리돼 있다.
 */

/** 사원 근무 상태(back/.../domain/employee/enums/EmpStatus.java 실측: PENDING/ACTIVE/RESIGNED/SUSPENDED). */
export type EmpStatus = 'PENDING' | 'ACTIVE' | 'RESIGNED' | 'SUSPENDED'

/**
 * 시스템 권한 코드(back/.../domain/employee/enums/SystemRoleCode.java 실측).
 * EMPLOYEE/DEPT_MANAGER/ADMIN은 Layer 1(계층형), FRANCHISE/IT/HR/FACILITY는 Layer 2(부서형) 권한이다.
 */
export type SystemRoleCode = 'EMPLOYEE' | 'DEPT_MANAGER' | 'ADMIN' | 'FRANCHISE' | 'IT' | 'HR' | 'FACILITY'

/** 사원 1건의 소속 부서 이력(현재 소속은 endAt이 null로 내려온다). */
export interface EmpBelonging {
  deptId: number
  deptCode: string
  deptName: string
  positionName: string
  isPrimary: boolean
  startAt: string
  endAt: string | null
}

/** 관리용 사원 목록 1건. */
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

/** 목록 조회 쿼리 파라미터(query-parameters.adoc: 전부 선택값). */
export interface EmpManagementListParams {
  deptId?: number
  status?: EmpStatus
  keyword?: string
  page?: number
  size?: number
}

/**
 * Spring Data Page 표준 구조(docs/backend-contract/page.md).
 * response-fields.adoc에 문서화된 필드만 포함한다(pageable/sort 등 미문서화 raw 필드는 제외) —
 * deptMember.ts의 Page<T>와 동일 컨벤션이나, 도메인이 달라 별도로 둔다.
 */
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

/** 사원 근무 상태 표시 라벨(EmpManagementSection 배지용). */
export const empStatusLabels: Record<EmpStatus, string> = {
  PENDING: '가입 대기',
  ACTIVE: '재직중',
  RESIGNED: '퇴직',
  SUSPENDED: '정직',
}

/** 시스템 권한 코드 표시 라벨(EmpManagementSection 배지·HrManagedInfoDialog/DeptManagedInfoDialog 체크박스 공용). */
export const systemRoleLabels: Record<SystemRoleCode, string> = {
  EMPLOYEE: '일반',
  DEPT_MANAGER: '부서관리자',
  ADMIN: '시스템관리자',
  FRANCHISE: '프랜차이즈',
  IT: 'IT',
  HR: '인사',
  FACILITY: '시설',
}

/** DEPT_MANAGER_UPDATE_EMP_INFO 계약상 부서매니저가 후보로 가질 수 있는 Layer-2 권한 후보군. */
export const LAYER2_ROLE_CODES: SystemRoleCode[] = ['FRANCHISE', 'IT', 'HR', 'FACILITY']

/** Badge 컴포넌트 variant 팔레트 중 상태/권한 표시에 쓰는 부분집합. */
type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

/**
 * 근무 상태별 배지 톤(목록 표·시트 공용). ACTIVE는 긍정 강조(primary), SUSPENDED는 경고(destructive),
 * RESIGNED는 비활성(muted secondary), PENDING은 중립(outline)으로 톤을 분리한다.
 */
export const empStatusBadgeVariant: Record<EmpStatus, StatusBadgeVariant> = {
  ACTIVE: 'default',
  PENDING: 'outline',
  SUSPENDED: 'destructive',
  RESIGNED: 'secondary',
}

/**
 * 시스템 권한별 배지 톤. Layer-1 관리 권한(ADMIN/DEPT_MANAGER)만 강조하고, 그 외(EMPLOYEE 및
 * Layer-2 기능 권한)는 중립 outline으로 둔다.
 */
export const systemRoleBadgeVariant: Record<SystemRoleCode, StatusBadgeVariant> = {
  ADMIN: 'default',
  DEPT_MANAGER: 'secondary',
  EMPLOYEE: 'outline',
  FRANCHISE: 'outline',
  IT: 'outline',
  HR: 'outline',
  FACILITY: 'outline',
}
