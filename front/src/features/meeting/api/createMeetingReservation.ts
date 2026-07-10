import dayjs from 'dayjs'
import { apiClient } from '@/shared/api/client'

/**
 * 회의 예약 생성 요청 페이로드(`MEETING_RESERVATION_CREATE`, request-fields.adoc 실측 기준(추측 금지)).
 * meetingRoomId(회의실 카드 선택)·reserverId(useMeQuery empId 주입)·title/meetingDate/startAt/endAt/
 * participantIds(meetingReservationCreateSchema 검증 필드)를 상위(T3.3-b)가 조합해 전달한다.
 */
export interface MeetingReservationCreatePayload {
  meetingRoomId: number
  reserverId: number
  title: string
  meetingDate: string
  startAt: string
  endAt: string
  participantIds: number[]
}

/**
 * 폼/다이얼로그의 시각 입력값을 서버 전송 포맷(`HH:mm`)으로 조립한다(PRD §계약 실측 메모 Open Q#5 —
 * request-fields.adoc의 필드 스펙이 권위이므로 `HH:mm`으로 전송, 응답 측 `HH:mm:ss` 혼재는 조회
 * 계층이 dayjs로 파싱해 흡수한다).
 */
export function formatMeetingTimeOfDay(value: Date): string {
  return dayjs(value).format('HH:mm')
}

/**
 * 회의 예약 생성(`MEETING_RESERVATION_CREATE`, api-endpoint.md 기능ID `MEETING_RESERVATION_CREATE` →
 * `POST /api/meetings`, 권한 EMPLOYEE). 성공 시 `201 Created`·응답 본문 없음(response-body.adoc 실측).
 * 검증/서버 실패는 그대로 던져 호출부(T3.3-b)가 submitWithErrorMapping으로 위임하도록 둔다.
 */
export async function createMeetingReservation(payload: MeetingReservationCreatePayload): Promise<void> {
  await apiClient.post('/api/meetings', payload)
}
