import { apiClient } from '@/shared/api/client'
import type { UpdateDeptManagedInfoFormValues } from '../model/updateDeptManagedInfoSchema'

/**
 * DEPT_MANAGER_UPDATE_EMP_INFO 요청 바디. `EmpUpdateRequestByDeptManager.java` 실측: 두 필드 다
 * `@Nullable`인 partial-update 계약이라, extensionNo는 "변경 안 함"을 표현하기 위해 undefined를
 * 허용한다(호출부가 빈 문자열을 undefined로 변환해 넘긴다 — DeptManagedInfoDialog 참고).
 */
export interface UpdateDeptManagedInfoRequest extends Omit<UpdateDeptManagedInfoFormValues, 'extensionNo'> {
  extensionNo?: string
}

/**
 * DEPT_MANAGER/ADMIN의 특정 사원 정보 수정(`DEPT_MANAGER_UPDATE_EMP_INFO`, api-endpoint.md
 * 기능ID `DEPT_MANAGER_UPDATE_EMP_INFO` → `PATCH /api/employees/{empId}/dept-managed-info`).
 * 성공 시 `204 No Content` — 호출부가 employeeKeys.detail(empId)/empsForManagement를 invalidate한다.
 * extensionNo가 undefined면 JSON.stringify가 해당 키를 생략해 서버가 미변경으로 처리한다.
 */
export async function updateDeptManagedInfo(
  empId: number,
  values: UpdateDeptManagedInfoRequest,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/dept-managed-info`, values)
}
