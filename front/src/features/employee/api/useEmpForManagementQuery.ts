import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'

/** 부서 전원이 한 페이지에 들어오도록 넉넉히 잡은 size. attendance 도메인의 "당월 전체 조회" 트릭과 동일 사고방식. */
const MANAGEMENT_LIST_SIZE = 100

/**
 * 사원 상세(EmployeeDetailPage)의 관리 섹션(EmpManagementSection)이 쓰는 단건 조회 훅.
 *
 * EMPS_FOR_MANAGEMENT는 목록 엔드포인트뿐이라(단건 조회 없음), deptId로 필터링한 목록을
 * size=100으로 통째로 가져온 뒤 select로 empId가 일치하는 레코드 하나만 골라낸다.
 *
 * enabled는 호출부가 계산한 "이 뷰어가 관리 권한이 있는가"(canManageAsHr/canManageAsDeptManager)
 * 여부를 그대로 받는다 — 권한 없는 뷰어가 이 화면을 열었을 때 불필요한 403 요청을 만들지 않기
 * 위함이다(HR/DEPT_MANAGER/ADMIN이 아니면 애초에 호출 자체를 막는다).
 */
export function useEmpForManagementQuery(
  deptId: number | undefined,
  empId: number | undefined,
  enabled: boolean,
) {
  const params = { deptId, size: MANAGEMENT_LIST_SIZE }
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
    enabled: enabled && deptId != null && empId != null,
    select: (data) => data.content.find((record) => record.empId === empId),
  })
}
