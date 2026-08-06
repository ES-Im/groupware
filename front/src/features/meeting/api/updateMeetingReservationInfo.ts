import { apiClient } from '@/shared/api/client'

export interface MeetingReservationUpdatePayload {
  meetingDate?: string
  startAt?: string
  endAt?: string
  meetingRoomId?: number
  title?: string
}

export async function updateMeetingReservationInfo(
  meetingId: number,
  payload: MeetingReservationUpdatePayload,
): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/reservation-info`, payload)
}
