import type { DraftDetailResponse } from '../model/draftDetail'

export function isBusinessTripDraft(draft: DraftDetailResponse): boolean {
  return draft.businessTrip != null
}
