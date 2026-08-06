import { BusinessTripDraftBody } from './BusinessTripDraftBody'
import { LeaveDraftBody } from './LeaveDraftBody'
import { SalesDraftBody } from './SalesDraftBody'
import type { DraftDetailSectionProps } from './types'

export function DraftTypeBody({ draft }: DraftDetailSectionProps) {
  if (draft.leave != null) {
    return <LeaveDraftBody draft={draft} />
  }
  if (draft.businessTrip != null) {
    return <BusinessTripDraftBody draft={draft} />
  }
  if (draft.sales != null) {
    return <SalesDraftBody draft={draft} />
  }

  return (
    <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {draft.content}
    </p>
  )
}
