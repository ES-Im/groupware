import { useQuery } from '@tanstack/react-query'
import { attendanceKeys } from '../model/queryKeys'
import { getDeptAttendanceMonthly } from './getDeptAttendanceMonthly'

/** 부서 전원이 한 페이지에 들어오도록 넉넉히 잡은 size(useEmpForManagementQuery와 동일 사고방식). */
const EMP_RECORDS_LIST_SIZE = 100

/**
 * 특정 사원 1인의 월별 근태 조회 훅(EmployeeDetailPage 관리용 레코드 위젯 전용, adapt-ui 신규).
 *
 * 사원 단건 근태 조회 엔드포인트가 없어(계약에 없음), `DEPT_ATTENDANCE_MONTHLY`(DEPT_MANAGER(같은
 * 부서) 또는 ADMIN 전용)를 size=100으로 통째로 가져온 뒤 select로 empId가 일치하는 행 하나만
 * 골라낸다(useEmpForManagementQuery와 동일 워크어라운드). queryKey/queryFn 파라미터를
 * useDeptAttendanceMonthlyQuery(DeptAttendanceBoardWidget)와 동일하게 맞춰, 같은 deptId+yearMonth를
 * 조회 중이면 react-query 캐시를 공유해 중복 요청을 피한다.
 */
export function useEmpAttendanceMonthlyQuery(
  deptId: number | undefined,
  empId: number | undefined,
  yearMonth: string,
  enabled: boolean,
) {
  const params = { yearMonth, size: EMP_RECORDS_LIST_SIZE }
  return useQuery({
    queryKey: attendanceKeys.deptMonthly(deptId, params),
    queryFn: () => getDeptAttendanceMonthly(deptId!, params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.find((row) => row.empInfo.empId === empId),
  })
}
