import type { PositionCode } from './positionCode'

export interface EmpBelongingsCreatePayload {
  deptId: number
  position: PositionCode
  isPrimary: boolean
  startAt: string
  endAt: null
}
