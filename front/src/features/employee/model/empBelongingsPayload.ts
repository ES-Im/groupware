import type { PositionCode } from '../registration/model/positionCode'

/**
 * 사원 소속 정보 등록/수정(`HR_UPDATE_EMP_BELONGINGS`) 요청 바디의 범용(raw) 타입.
 * 백엔드 `EmpBelongingsUpdateRequest.java` 실측: 전 필드 `@Nullable`인 partial-update 계약 —
 * `deptId != null`이면 "신규 소속 등록"(`registerEmpBelonging`), `deptId == null`이면 "현재 소속
 * 수정"(`updateCurrentBelonging`)으로 분기한다(`Emp.java` `changeBelongingsByHR` 실측).
 *
 * `registration/model/empBelongingsCreatePayload.ts`의 `EmpBelongingsCreatePayload`(신규 등록
 * 전용 좁은 타입, 전 필드 필수+endAt 리터럴 null)는 이 타입에 구조적으로 포함되므로 그대로
 * `updateEmpBelongings`에 전달 가능하다 — 별도 변환 불필요.
 */
export interface EmpBelongingsRawPayload {
  deptId: number | null
  position: PositionCode | null
  isPrimary: boolean | null
  startAt: string | null
  endAt: string | null
}
