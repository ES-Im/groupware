import { apiClient } from '@/shared/api/client'
import type { MeetingReservationDetail } from '../model/meeting'

export async function getMeetingReservationDetail(meetingId: number): Promise<MeetingReservationDetail> {
  const { data } = await apiClient.get<MeetingReservationDetail>(`/api/meetings/${meetingId}`)
  return data
}
