import type { PositionCode } from './positionCode'

/**
 * 소속 배정(HR_UPDATE_EMP_BELONGINGS, PATCH /api/employees/{empId}/belongings) 요청 바디 타입.
 * 필드는 back/build/generated-snippets/HR_UPDATE_EMP_BELONGINGS/request-fields.adoc 실측 기준(추측 금지).
 * 이번 PRD는 신규 등록 케이스만 다루므로 deptId·position·isPrimary·startAt은 필수이고,
 * endAt은 null 리터럴로 고정해 '수정 케이스'(deptId=null)와 타입 레벨에서부터 구분한다.
 */
export interface EmpBelongingsCreatePayload {
  deptId: number
  position: PositionCode
  isPrimary: boolean
  startAt: string
  endAt: null
}
