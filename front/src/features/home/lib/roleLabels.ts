const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: '사원',
  DEPT_MANAGER: '부서 관리자',
  ADMIN: '관리자',
  HR: '인사 담당',
  FRANCHISE: '가맹점 담당',
  FACILITY: '시설 담당',
  IT: 'IT 담당',
}

export function getRoleLabel(role: string): string {
  return ROLE_LABEL[role] ?? role
}
