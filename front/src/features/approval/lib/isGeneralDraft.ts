import type { DraftDetailResponse } from '../model/draftDetail'

export function isGeneralDraft(draft: DraftDetailResponse): boolean {
  return (
    draft.leave == null &&
    draft.businessTrip == null &&
    draft.sales == null &&
    draft.sourceDraftId == null
  )
}
