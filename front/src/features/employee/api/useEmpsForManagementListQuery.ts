import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'
import type { EmpManagementListParams } from '../model/empManagement'

/**
 * 사원관리 목록 페이지(EmpManagementListPage)가 쓰는 페이징 조회 훅.
 *
 * useEmpForManagementQuery(단건, size=100 고정 + select로 empId 하나만 골라냄)와 달리 이 훅은
 * params를 그대로 서버에 전달하고 EmpManagementPage 전체(Page 메타 포함)를 반환한다 — 목록
 * 페이지의 필터(deptId/status/keyword)·페이징(page/size) UI가 그대로 소비할 수 있어야 하기 때문이다.
 * 같은 EMPS_FOR_MANAGEMENT 엔드포인트를 쓰므로 queryKey는 employeeKeys.empsForManagement(params)를
 * 그대로 재사용해 캐시를 공유한다.
 */
export function useEmpsForManagementListQuery(params: EmpManagementListParams) {
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
  })
}
