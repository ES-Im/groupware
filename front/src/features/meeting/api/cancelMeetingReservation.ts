import { apiClient } from '@/shared/api/client'

export async function cancelMeetingReservation(meetingId: number): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/cancel`)
}
