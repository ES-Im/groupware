export interface DraftPreviewField {
  label: string
  value: string
}

export interface DraftPreviewApprover {
  empId: number
  empName: string
  role: string
}

export interface DraftPreviewCirculation {
  empId: number
  empName: string
}

export interface DraftPrintPreviewPayload {
  typeLabel: string
  title: string
  content: string
  fields: DraftPreviewField[]
  approvers: DraftPreviewApprover[]
  circulations: DraftPreviewCirculation[]
  attachments: string[]
}

export const DRAFT_PRINT_PREVIEW_STORAGE_KEY = 'haruon:draft-print-preview'
