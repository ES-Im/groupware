export interface DraftEmployeeRef {
  empId: number
  empName: string
}

export interface DraftApprover {
  empId: number
  empName: string
  role: string
  order: number
  approvedAt: string | null
  rejectedAt: string | null
  rejectReason: string | null
}

export interface DraftCirculation {
  empId: number
  empName: string
  readAt: string | null
}

export interface DraftFile {
  fileId: number
  originalName: string
  mimeType: string
  extension: string
  fileSize: number
}

export interface BusinessTripSlot {
  startAt: string
  endAt: string
  destination: string
  purpose: string
  participants: DraftEmployeeRef[]
}

export interface LeaveSlot {
  startAt: string
  endAt: string
  leaveType: string
  reservedHours: number
}

export interface SalesSlot {
  franchiseId: number
  franchiseName: string
  reportMonth: string
  salesAmount: number
}

export interface DraftDetailResponse {
  draftId: number
  draftType: string
  drafter: DraftEmployeeRef
  title: string
  content: string
  submittedAt: string | null
  approvalStatus: string
  files: DraftFile[]
  approvers: DraftApprover[]
  circulations: DraftCirculation[]
  sourceDraftId: number | null
  cancellationDraftId: number | null
  cancellationSubmittedAt: string | null
  leave: LeaveSlot | null
  businessTrip: BusinessTripSlot | null
  sales: SalesSlot | null
}
