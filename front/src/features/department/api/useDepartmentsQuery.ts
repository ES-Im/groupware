import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { departmentKeys } from '../model/queryKeys'
import { getDepartments } from './getDepartments'

/**
 * 전체 부서 목록 조회 훅(`DEPTS`, ROADMAP T6.2, 조직도/부서 목록 화면에서 검색·필터·페이징
 * 파라미터 연동). params(keyword/isActive/page/size)는 queryKey에 그대로 포함되어
 * 값이 바뀔 때마다 재요청된다. deptId 의존이 없는 목록 조회라 detail/members와 달리
 * 기본적으로 enabled 가드가 필요 없다.
 *
 * `enabled`(ROADMAP T9.3에서 추가): 항상 마운트돼 있는 다이얼로그(예: 상위 부서 변경
 * 다이얼로그, F207)가 내부에서 이 훅을 호출할 때, 다이얼로그가 열려 있을 때만 후보 목록을
 * 조회하도록 제한하기 위한 선택 파라미터다. 미전달 시 기존 호출부(DepartmentsPage, T6.3)와
 * 동일하게 항상 활성화된다.
 *
 * placeholderData: keepPreviousData로 검색·필터·페이지 변경 시 새 응답이 도착하기 전까지
 * 이전 목록을 유지해 표가 매번 "불러오는 중..."으로 전면 교체되는 깜빡임을 막는다.
 */
export function useDepartmentsQuery(
  params?: {
    keyword?: string
    isActive?: boolean
    page?: number
    size?: number
  },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: () => getDepartments(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })
}
