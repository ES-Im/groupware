/**
 * department 도메인 queryKey 팩토리(ROADMAP T0.3 / T2.1-a / §A-3).
 * all을 배열 리터럴로 고정해 무효화(invalidateQueries) 시 departmentKeys.all로 하위 전체를 한 번에 갱신할 수 있게 한다.
 * employeeKeys(@/features/employee/model/queryKeys)와는 도메인이 달라 별도 팩토리로 둔다.
 *
 * members(deptId)는 deptId가 아직 확정되지 않은 상태(useMeQuery 로딩 중)에서도 훅이
 * enabled:false로 대기하며 queryKey를 구성할 수 있도록 number | undefined를 받는다.
 */
export const departmentKeys = {
  all: ['department'] as const,
  members: (deptId: number | undefined) => [...departmentKeys.all, 'members', deptId] as const,
}
