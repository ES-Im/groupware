import type { DraftDetailResponse } from '../model/draftDetail'

export function isLeaveDraft(draft: DraftDetailResponse): boolean {
  return draft.leave != null
}
