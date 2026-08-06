import { apiClient } from '@/shared/api/client'

export async function replaceMeetingParticipants(meetingId: number, participantIds: number[]): Promise<void> {
  await apiClient.patch(`/api/meetings/${meetingId}/participants`, { participantIds })
}
