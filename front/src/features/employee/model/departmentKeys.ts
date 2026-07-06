/**
 * department 도메인 queryKey 팩토리(ROADMAP T0.3 / §A-3).
 * all을 배열 리터럴로 고정해 무효화(invalidateQueries) 시 departmentKeys.all로 하위 전체를 한 번에 갱신할 수 있게 한다.
 */
export const departmentKeys = {
  all: ['department'] as const,
  members: (deptId: number) => [...departmentKeys.all, 'members', deptId] as const,
}
