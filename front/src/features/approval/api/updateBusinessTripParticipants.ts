import { apiClient } from '@/shared/api/client'

export async function updateBusinessTripParticipants(
  draftId: number,
  participantIds: number[],
): Promise<void> {
  await apiClient.patch(`/api/drafts/business-trips/${draftId}/participants`, participantIds)
}
