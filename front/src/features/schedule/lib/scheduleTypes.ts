import type { ScheduleType } from '../model/schedule'

export interface ManualScheduleCreatePayload {
  title: string
  content: string
  startAt: string
  endAt: string
}

export interface ManualScheduleCreateResponse {
  sourceKey: string
}

export type ScheduleScope = 'SINGLE' | 'SERIES'

export interface ManualScheduleUpdatePayload {
  title?: string
  content?: string
  startAt?: string
  endAt?: string
}

export interface ScheduleParticipant {
  empId: number
  deptName: string
  empName: string
}

export interface ScheduleDetailResponse {
  scheduleId: number
  scheduleType: ScheduleType
  ownerId: number
  ownerDeptName: string
  ownerEmpName: string
  isEditable: boolean
  title: string
  content: string
  scheduleDate: string
  startAt: string
  endAt: string
  isAllDay: boolean
  isCanceled: boolean
  participantCount: number
  participants: ScheduleParticipant[]
}
