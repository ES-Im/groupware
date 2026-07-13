import { apiClient } from '@/shared/api/client'

/**
 * 사원 퇴직 처리(`HR_RESIGN_EMP`, api-endpoint.md
 * `PATCH /api/employees/{empId}/resignation?hiredAt={value}`, HR 또는 ADMIN).
 *
 * ⚠️ 쿼리 파라미터명은 `hiredAt`이지만(EmpManagementApi.java `resignEmployee` 실측: `@RequestParam
 * ... LocalDate hiredAt`), 실제 의미는 "퇴직일"이다(서비스 `updateResignedEmpByHR`가 이 값을
 * 퇴직 처리에 사용). 백엔드 파라미터 네이밍이 그대로 남아있는 것이라 프론트는 의미(퇴직일)에 맞는
 * 인자명 `resignAt`을 쓰되, 쿼리스트링 키는 백엔드 계약대로 `hiredAt`을 그대로 보낸다.
 * 성공 시 `204 No Content` — 호출부(useResignEmpMutation)가 캐시를 invalidate한다.
 */
export async function resignEmp(empId: number, resignAt: string): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/resignation`, undefined, {
    params: { hiredAt: resignAt },
  })
}
