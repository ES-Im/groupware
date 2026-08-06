import type { DeptInfoResponse, DeptLeaderWire } from './deptInfo'
import type { Page } from './deptMember'

export interface DeptSummary {
  deptInfoResponse: DeptInfoResponse
  deptLeader: DeptLeaderWire
}

export type DeptsPage = Page<DeptSummary>
