/**
 * employee 도메인 queryKey 팩토리(ROADMAP T0.3 / §A-3).
 * all을 배열 리터럴로 고정해 무효화(invalidateQueries) 시 employeeKeys.all로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * detail(empId)는 empId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 실패 등)에서도 훅이
 * enabled:false로 대기하며 queryKey를 구성할 수 있도록 number | undefined를 받는다
 * (departmentKeys.members와 동일 컨벤션, ROADMAP T2.2).
 */
export const employeeKeys = {
  all: ['employee'] as const,
  me: () => [...employeeKeys.all, 'me'] as const,
  detail: (empId: number | undefined) => [...employeeKeys.all, 'detail', empId] as const,
}
