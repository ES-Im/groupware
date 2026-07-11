import type { ScheduleType } from '../model/schedule'

/**
 * schedule 도메인 요청/응답 타입(ROADMAP(SCHEDULE) T3.1 / MANUAL_SCHEDULE_CREATE 실측 기준).
 * 이후 태스크(T3.2 zod 스키마, T4.x 수정)가 이 파일에 타입을 추가한다.
 */

/** 수기 일정 등록 요청 바디(request-fields.adoc: title≤100자·공백불가, content 공백불가, startAt/endAt full datetime). */
export interface ManualScheduleCreatePayload {
  title: string
  content: string
  startAt: string
  endAt: string
}

/** 수기 일정 등록 응답(response-fields.adoc: sourceKey — 동일 일정 묶음 식별 키). */
export interface ManualScheduleCreateResponse {
  sourceKey: string
}

/**
 * 적용 범위 쿼리(SINGLE 기본값 | SERIES 동일 일정 전체, query-parameters.adoc 실측).
 * MANUAL_SCHEDULE_UPDATE/SCHEDULE_CANCEL/SCHEDULE_PARTICIPANTS_ADD·REMOVE 공통 쿼리 타입.
 */
export type ScheduleScope = 'SINGLE' | 'SERIES'

/**
 * 수기 일정 수정 요청 바디(MANUAL_SCHEDULE_UPDATE request-fields.adoc: 전 필드 optional,
 * startAt/endAt은 HH:mm:ss 시각만 — CREATE(ManualScheduleCreatePayload)의 full datetime과 다름).
 */
export interface ManualScheduleUpdatePayload {
  title?: string
  content?: string
  startAt?: string
  endAt?: string
}

/** 일정 상세 참여자(SCHEDULE_DETAIL response-fields.adoc: participants[]). */
export interface ScheduleParticipant {
  empId: number
  deptName: string
  empName: string
}

/** 일정 상세 응답(`SCHEDULE_DETAIL`, `GET /api/schedules/{scheduleId}` response-fields.adoc 실측). */
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
