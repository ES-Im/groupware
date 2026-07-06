import { useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentMembers } from './getDepartmentMembers'

/**
 * 부서 멤버 목록 조회 훅(ROADMAP T2.1-a).
 * deptId는 useMeQuery()의 currentDepts에서 getPrimaryDeptId로 자동 도출되어 전달된다
 * (부서 선택 UI는 이번 스코프에 없음 — 사용자 확정 결정).
 *
 * deptId가 아직 없을 때(me 로딩 중)는 enabled:false로 훅 호출을 지연해 잘못된 요청을 막는다.
 * queryFn은 enabled 가드로 인해 deptId가 확정된 경우에만 실행되므로 number로 단언한다.
 */
export function useDepartmentMembersQuery(deptId: number | undefined) {
  return useQuery({
    queryKey: departmentKeys.members(deptId),
    queryFn: () => getDepartmentMembers(deptId as number),
    enabled: deptId != null,
  })
}
