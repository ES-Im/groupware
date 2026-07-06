/**
 * 권한 계층(RoleHierarchy, security.md)에 따라 상위 역할이 자동으로 포함하는 하위 역할 목록.
 * ADMIN은 전 역할을, DEPT_MANAGER/HR/FACILITY/FRANCHISE/IT는 각각 EMPLOYEE를 포함한다.
 * IT는 표의 Layer 2 역할 코드 목록에 있으나 별도 전개 대상(포함하는 하위 역할)은 명시되지 않아 EMPLOYEE 포함만 반영한다.
 */
const ROLE_HIERARCHY: Record<string, string[]> = {
  ADMIN: ['EMPLOYEE', 'DEPT_MANAGER', 'HR', 'FACILITY', 'FRANCHISE', 'IT'],
  DEPT_MANAGER: ['EMPLOYEE'],
  HR: ['EMPLOYEE'],
  FACILITY: ['EMPLOYEE'],
  FRANCHISE: ['EMPLOYEE'],
  IT: ['EMPLOYEE'],
}

function expandRoles(userRoles: string[]): Set<string> {
  const expanded = new Set(userRoles)
  for (const role of userRoles) {
    for (const implied of ROLE_HIERARCHY[role] ?? []) {
      expanded.add(implied)
    }
  }
  return expanded
}

/**
 * userRoles(ROLE_ 접두어 제거된 정규화 배열)가 minRole을 계층상 포함하는지 판정한다.
 * JWT roles는 로그인 시점 스냅샷이므로 이 결과는 UI 게이팅 힌트일 뿐, 서버의 401/403이 최종 진실이다(security.md).
 */
export function hasRequiredRole(userRoles: string[], minRole: string): boolean {
  return expandRoles(userRoles).has(minRole)
}
