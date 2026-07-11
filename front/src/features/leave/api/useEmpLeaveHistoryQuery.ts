import { useQuery } from '@tanstack/react-query'
import { leaveKeys } from '../model/leaveKeys'
import { getDeptLeaveHistory } from './getDeptLeaveHistory'

/** 부서 전원이 한 페이지에 들어오도록 넉넉히 잡은 size(useEmpForManagementQuery와 동일 사고방식). */
const EMP_RECORDS_LIST_SIZE = 100

/**
 * 특정 사원 1인의 월별 휴가 신청 이력 조회 훅(EmployeeDetailPage 관리용 레코드 위젯 전용, adapt-ui 신규).
 *
 * 사원 단건 휴가 이력 조회 엔드포인트가 없어(계약에 없음), `DEPT_LEAVE_REQUEST_HISTORY`(DEPT_MANAGER
 * (같은 부서) 또는 ADMIN 전용)를 size=100으로 통째로 가져온 뒤 select로 empId가 일치하는 행만
 * 골라낸다(useEmpForManagementQuery와 동일 워크어라운드). queryKey/queryFn 파라미터를
 * useDeptLeaveHistoryQuery와 동일하게 맞춰 캐시를 공유한다.
 */
export function useEmpLeaveHistoryQuery(
  deptId: number | undefined,
  empId: number | undefined,
  yearMonth: string,
  enabled: boolean,
) {
  const params = { yearMonth, size: EMP_RECORDS_LIST_SIZE }
  return useQuery({
    queryKey: leaveKeys.deptHistory(deptId, params),
    queryFn: () => getDeptLeaveHistory(deptId!, params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.filter((row) => row.empId === empId),
  })
}
