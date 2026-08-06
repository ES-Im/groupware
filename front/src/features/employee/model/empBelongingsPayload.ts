import type { PositionCode } from '../registration/model/positionCode'

export interface EmpBelongingsRawPayload {
  deptId: number | null
  position: PositionCode | null
  isPrimary: boolean | null
  startAt: string | null
  endAt: string | null
}
