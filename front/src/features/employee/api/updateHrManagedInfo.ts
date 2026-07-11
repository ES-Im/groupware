import { apiClient } from '@/shared/api/client'
import type { UpdateHrManagedInfoFormValues } from '../model/updateHrManagedInfoSchema'

/**
 * HR_UPDATE_EMP_INFO 요청 바디. `EmpUpdateRequestByHR.java` 실측: 전 필드 `@Nullable`인
 * partial-update 계약이라, 폼 값(UpdateHrManagedInfoFormValues, 전부 string)과 달리 password/
 * extensionNo는 "변경 안 함"을 표현하기 위해 undefined를 허용한다(호출부가 빈 문자열을 undefined로
 * 변환해 넘긴다 — HrManagedInfoDialog 참고).
 */
export interface UpdateHrManagedInfoRequest extends Omit<UpdateHrManagedInfoFormValues, 'password' | 'extensionNo'> {
  password?: string
  extensionNo?: string
}

/**
 * HR/ADMIN의 특정 사원 정보 수정(`HR_UPDATE_EMP_INFO`, api-endpoint.md 기능ID
 * `HR_UPDATE_EMP_INFO` → `PATCH /api/employees/{empId}/hr-managed-info`).
 * 성공 시 `204 No Content` — 호출부가 employeeKeys.detail(empId)/empsForManagement를 invalidate한다.
 * password/extensionNo가 undefined면 JSON.stringify가 해당 키를 생략해 서버가 미변경으로 처리한다.
 */
export async function updateHrManagedInfo(
  empId: number,
  values: UpdateHrManagedInfoRequest,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/hr-managed-info`, values)
}
