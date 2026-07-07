/**
 * department 도메인 queryKey 팩토리(ROADMAP T0.3 / T2.1-a / T6.2 / §A-3).
 * all을 배열 리터럴로 고정해 무효화(invalidateQueries) 시 departmentKeys.all로 하위 전체를 한 번에 갱신할 수 있게 한다.
 * employeeKeys(@/features/employee/model/queryKeys)와는 도메인이 달라 별도 팩토리로 둔다.
 *
 * detail(deptId)/members(deptId, params)는 deptId가 아직 확정되지 않은 상태(useMeQuery 로딩 중)
 * 에서도 훅이 enabled:false로 대기하며 queryKey를 구성할 수 있도록 number | undefined를 받는다.
 *
 * members의 params(keyword/page/size)와 list의 params(keyword/isActive/page/size)는 검색·필터·
 * 페이징 상태가 바뀔 때마다 별도 캐시 엔트리로 구분되도록 queryKey에 그대로 포함한다
 * (members: 부서 상세 화면 DEPT_MEMBERS, list: 부서 목록/조직도 화면 DEPTS 쿼리 파라미터 연동).
 */
export const departmentKeys = {
  all: ['department'] as const,
  detail: (deptId: number | undefined) => [...departmentKeys.all, 'detail', deptId] as const,
  members: (
    deptId: number | undefined,
    params?: { keyword?: string; page?: number; size?: number },
  ) => [...departmentKeys.all, 'members', deptId, params] as const,
  list: (params?: { keyword?: string; isActive?: boolean; page?: number; size?: number }) =>
    [...departmentKeys.all, 'list', params] as const,
}
