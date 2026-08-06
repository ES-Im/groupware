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

export function hasRequiredRole(userRoles: string[], minRole: string): boolean {
  return expandRoles(userRoles).has(minRole)
}
