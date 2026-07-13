import { apiClient } from '@/shared/api/client'
import type { EmpBelongingsRawPayload } from '../../model/empBelongingsPayload'

/**
 * 사원 소속 정보 등록/수정(`HR_UPDATE_EMP_BELONGINGS`, api-endpoint.md 기능ID
 * `HR_UPDATE_EMP_BELONGINGS` → `PATCH /api/employees/{empId}/belongings`).
 * 성공 시 `204 No Content`.
 *
 * 파라미터 타입은 범용(raw) 타입인 `EmpBelongingsRawPayload`다 — 신규 등록(이 파일의 원래 소비처인
 * `EmpApprovalWizardDialog`, 좁은 타입 `EmpBelongingsCreatePayload` 전달)뿐 아니라, 재직 사원의
 * 부서 전보(`useTransferEmpBelongingMutation`, "현재 소속 종료" 호출은 deptId:null+endAt만 채움)도
 * 이 함수를 공유한다.
 */
export async function updateEmpBelongings(
  empId: number,
  payload: EmpBelongingsRawPayload,
): Promise<void> {
  await apiClient.patch(`/api/employees/${empId}/belongings`, payload)
}
