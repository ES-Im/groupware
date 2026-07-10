import { apiClient } from '@/shared/api/client'
import type { MeetingReservationDetail } from '../model/meeting'

/**
 * 회의 예약 상세 조회(`MEETING_RESERVATION_DETAIL`, api-endpoint.md 기능ID
 * `MEETING_RESERVATION_DETAIL` → `GET /api/meetings/{meetingId}`).
 */
export async function getMeetingReservationDetail(meetingId: number): Promise<MeetingReservationDetail> {
  const { data } = await apiClient.get<MeetingReservationDetail>(`/api/meetings/${meetingId}`)
  return data
}
