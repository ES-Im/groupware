import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartmentMembers } from './getDepartmentMembers'

/**
 * 부서 멤버 목록 조회 훅(ROADMAP T2.1-a, 부서 상세 화면에서 검색·페이징 파라미터 연동).
 * deptId 출처는 호출부마다 다르다 — DepartmentMembersPage(/department-members)는
 * useMeQuery()의 currentDepts에서 getPrimaryDeptId로 자동 도출하고, DepartmentDetailPage
 * (/departments/:deptId, T7.1)는 라우트 파라미터를 그대로 전달한다. 이 훅 자체는 출처를
 * 알지 못하므로 시그니처를 그대로 재사용한다.
 *
 * deptId가 아직 없을 때(me 로딩 중 또는 유효하지 않은 route param)는 enabled:false로 훅
 * 호출을 지연해 잘못된 요청을 막는다. queryFn은 enabled 가드로 인해 deptId가 확정된 경우에만
 * 실행되므로 number로 단언한다. params(keyword/page/size)는 queryKey에 그대로 포함되어
 * 값이 바뀔 때마다 재요청된다.
 *
 * placeholderData: keepPreviousData(T6.2 useDepartmentsQuery와 동일 패턴)로 검색어·페이지
 * 변경 시 새 응답이 도착하기 전까지 이전 목록을 유지해, 표가 매번 "불러오는 중..."으로
 * 전면 교체되며 좌측 카드까지 깜빡이는 것을 막는다.
 */
export function useDepartmentMembersQuery(
  deptId: number | undefined,
  params?: { keyword?: string; page?: number; size?: number },
) {
  return useQuery({
    queryKey: departmentKeys.members(deptId, params),
    queryFn: () => getDepartmentMembers(deptId as number, params),
    enabled: deptId != null,
    placeholderData: keepPreviousData,
  })
}
