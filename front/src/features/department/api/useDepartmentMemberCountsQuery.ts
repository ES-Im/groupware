import { useQueries } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentMembers } from './getDepartmentMembers'

/**
 * 부서별 멤버 수 병렬 조회 훅(조직도 트리 노드의 인원수 배지·요약 카드 합산용).
 *
 * 부서 인원수만 알려주는 전용 API가 없어(DEPT_MEMBERS만 존재), 부서마다
 * `GET /api/departments/{deptId}/members?size=1`을 병렬 호출해 content는 버리고
 * totalElements만 읽어온다("활성 인원수"는 개별 멤버 응답에 활성여부 필드가 없어
 * 이번 스코프에서 의도적으로 만들지 않는다 — 팀 결정).
 */
export function useDepartmentMemberCountsQuery(deptIds: number[]) {
  const results = useQueries({
    queries: deptIds.map((deptId) => ({
      queryKey: departmentKeys.members(deptId, { size: 1 }),
      queryFn: () => getDepartmentMembers(deptId, { size: 1 }),
    })),
  })

  const counts: Record<number, number> = {}
  results.forEach((result, index) => {
    if (result.data) {
      counts[deptIds[index]] = result.data.totalElements
    }
  })

  return {
    counts,
    isLoading: results.some((result) => result.isLoading),
  }
}
