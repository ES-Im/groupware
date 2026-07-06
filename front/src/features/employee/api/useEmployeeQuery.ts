import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmployee } from './getEmployee'

/**
 * 타 사원 상세(사원 상세 페이지, ROADMAP T2.2) 조회 훅.
 * empId는 라우트 파라미터(문자열)를 Number()로 변환한 값을 받으며, 파싱 실패(NaN) 시에는
 * enabled:false로 대기해 잘못된 요청이 나가지 않도록 한다(useDepartmentMembersQuery와 동일 컨벤션).
 */
export function useEmployeeQuery(empId: number | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(empId),
    queryFn: () => getEmployee(empId as number),
    enabled: empId != null && !Number.isNaN(empId),
  })
}
