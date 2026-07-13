import { useQuery } from '@tanstack/react-query'
import { employeeKeys } from '../model/queryKeys'
import { getEmpsForManagement } from './getEmpsForManagement'

/**
 * 부서 전원이 한 페이지에 들어오도록 넉넉히 잡은 size. useEmpForManagementQuery(단건 select)와
 * 완전히 동일한 params 형태({deptId, size:100})를 써서 같은 캐시 엔트리를 공유하게 한다
 * (한 번의 요청으로 부서원 관리 레코드 전체를 확보 → 이후 empId별 조회는 캐시에서 즉시 해소).
 */
const MANAGEMENT_LIST_SIZE = 100

/**
 * 부서 구성원 목록 화면(DepartmentMembersView)의 "정보 수정" 모달이 쓰는 관리용 사원 레코드 전량
 * 조회 훅. useEmpForManagementQuery(EmpManagementSection용, empId 하나만 select)와 달리 부서
 * 전체 레코드를 그대로 반환해, 화면이 empId→EmpManagementRecord 룩업 맵을 만들어 모달을 즉시
 * 띄우게 한다(모달 열 때마다 네트워크 대기하지 않도록 목록과 함께 미리 프리페치).
 *
 * enabled는 호출부가 계산한 관리 권한 여부(canManageMembers)를 그대로 받는다 — 권한 없는 뷰어가
 * 이 목록을 열었을 때 불필요한 403 요청을 만들지 않기 위함이다(HR/DEPT_MANAGER/ADMIN이 아니면
 * 애초에 호출 자체를 막는다). deptId가 아직 확정되지 않았으면(undefined) 대기한다.
 */
export function useDeptEmpManagementListQuery(deptId: number | undefined, enabled: boolean) {
  const params = { deptId, size: MANAGEMENT_LIST_SIZE }
  return useQuery({
    queryKey: employeeKeys.empsForManagement(params),
    queryFn: () => getEmpsForManagement(params),
    enabled: enabled && deptId != null,
  })
}
