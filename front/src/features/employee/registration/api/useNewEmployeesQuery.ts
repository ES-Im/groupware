import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../../model/queryKeys'
import { getNewEmployees } from './getNewEmployees'

/**
 * 가입대기자 목록 조회 훅(`NEW_EMP_LIST`, ROADMAP T1.4, useDepartmentsQuery 동형).
 * deptId 등 조회 전제조건이 없는 목록이라 enabled 가드가 필요 없다.
 *
 * placeholderData: keepPreviousData로 keyword/page 변경 시 새 응답이 도착하기 전까지
 * 이전 목록을 유지해 표가 매번 "불러오는 중..."으로 전면 교체되는 깜빡임을 막는다.
 */
export function useNewEmployeesQuery(params?: { keyword?: string; page?: number; size?: number }) {
  return useQuery({
    queryKey: employeeKeys.newEmployees(params),
    queryFn: () => getNewEmployees(params),
    placeholderData: keepPreviousData,
  })
}
