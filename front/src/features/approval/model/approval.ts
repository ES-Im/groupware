export type ApprovalStatus =
  | 'UNSUBMITTED'
  | 'WAITING'
  | 'IN_PROGRESS'
  | 'APPROVED'
  | 'REJECTED'

export interface DocumentBoxRow {
  draftId: number
  drafterName: string
  draftTitle: string
  submittedAt: string | null
  latestApproverName: string | null
  isFileAttached: boolean
  approvalStatus: string
}

export interface DocumentBoxQueryParams {
  keyword?: string
  page?: number
  size?: number
}

export interface MyDocumentBoxSummary {
  pendingApprovalDraftCount: number
  unsubmittedDraftCount: number
  submittedDraftCount: number
  accessibleDocumentCount: number
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}
