import type { DraftDetailResponse } from '../model/draftDetail'

export function isSalesDraft(draft: DraftDetailResponse): boolean {
  return draft.sales != null
}
