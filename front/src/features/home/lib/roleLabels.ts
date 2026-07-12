/**
 * 역할 코드 → 한글 표시 라벨(security.md §권한 모델 2-Layer 실측: Layer1 EMPLOYEE/DEPT_MANAGER/ADMIN,
 * Layer2 HR/FRANCHISE/FACILITY/IT). authStore.roles(ROLE_ 접두어 제거된 정규화 배열)를 그대로
 * 키로 쓴다. 계약 밖 값(향후 역할 추가 등)은 원문을 그대로 반환해 배지가 사라지지 않게 한다.
 */
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
