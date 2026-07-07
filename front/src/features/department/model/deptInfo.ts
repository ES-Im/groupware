/**
 * 부서 상세 조회(`DEPT_INFO`, GET /api/departments/{deptId}) 응답 타입.
 * 필드는 back/build/generated-snippets/DEPT_INFO/response-fields.adoc 실측 기준(추측 금지).
 */

/** 부서 기본 정보. */
export interface DeptInfoResponse {
  deptId: number
  deptCode: string
  deptName: string
  isActive: boolean
  parentDeptId: number | null
}

/**
 * 부서장 wire 원본 타입(`DEPT_INFO`/`DEPTS` 공통, 3.department-management-prd.md
 * "부서장 공석 wire 계약" 절 실측 확정). response-fields.adoc은 각 필드를 표면상
 * non-null(Number/String)로만 기술하지만, 실측 결과 부서장 미지정 부서는 `deptLeader`가
 * JSON null이 아니라 전 필드가 null인 객체로 내려온다. 그래서 wire 타입은 전 필드를
 * nullable로 선언하고, `normalizeDeptLeader`(lib/normalizeDeptLeader.ts)로 정규화한 뒤에만
 * 화면 전용 `DeptLeader | null`로 좁힌다.
 */
export interface DeptLeaderWire {
  empId: number | null
  empNo: string | null
  empName: string | null
  extensionNo: string | null
  email: string | null
  position: string | null
}

/** 화면 전용 부서장 정보. 공석이면 `normalizeDeptLeader`가 null을 반환하므로 이 타입은 항상 non-null 필드만 갖는다. */
export interface DeptLeader {
  empId: number
  empNo: string
  empName: string
  extensionNo: string | null
  email: string
  position: string
}

export interface DepartmentDetailResponse {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeaderWire
}
