import type { DeptLeader, DeptLeaderWire } from '../model/deptInfo'

/**
 * 부서장 wire → 화면 전용 타입 정규화(3.department-management-prd.md "부서장 공석 wire 계약" 절,
 * `DEPT_INFO`/`DEPTS` 공통 규칙). 부서장 미지정 부서는 `deptLeader`가 JSON null이 아니라
 * 전 필드가 null인 객체로 내려오므로, `empName`(식별 필드) 유무로 공석을 판별해
 * 공석이면 null을, 아니면 non-null `DeptLeader`로 좁혀 반환한다.
 * `DEPT_INFO`(부서 상세)·`DEPTS`(부서 목록, T6.2) 양쪽에서 재사용한다.
 */
export function normalizeDeptLeader(wire: DeptLeaderWire | null): DeptLeader | null {
  if (wire == null || wire.empId == null || wire.empName == null) {
    return null
  }
  return {
    empId: wire.empId,
    empNo: wire.empNo ?? '',
    empName: wire.empName,
    extensionNo: wire.extensionNo,
    email: wire.email ?? '',
    position: wire.position ?? '',
  }
}
