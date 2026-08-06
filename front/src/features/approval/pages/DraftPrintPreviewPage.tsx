import dayjs from 'dayjs'
import { useParams } from 'react-router'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import {
  DraftPrintDocument,
  type PrintApprovalColumn,
  type PrintApprovalMark,
} from '../components/print/DraftPrintDocument'
import {
  formatDraftDateTime,
  getApprovalRoleLabel,
  resolveApprovalStatus,
} from '../lib/approvalStatusBadge'
import { getDraftTypeMeta, resolveDraftTypeKey } from '../lib/draftTypes'
import { isBusinessTripDraft } from '../lib/isBusinessTripDraft'
import { isLeaveDraft } from '../lib/isLeaveDraft'
import { isSalesDraft } from '../lib/isSalesDraft'
import type { DraftDetailResponse } from '../model/draftDetail'
import { leaveTypeLabels, type LeaveType } from '../model/leaveDraftSchema'

function resolveLeaveTypeLabel(leaveType: string): string {
  return leaveTypeLabels[leaveType as LeaveType] ?? leaveType
}

function resolveBodyFields(draft: DraftDetailResponse): { label: string; value: string }[] {
  if (isLeaveDraft(draft) && draft.leave) {
    return [
      { label: '휴가 유형', value: resolveLeaveTypeLabel(draft.leave.leaveType) },
      {
        label: '휴가 기간',
        value: `${formatDraftDateTime(draft.leave.startAt)} ~ ${formatDraftDateTime(draft.leave.endAt)}`,
      },
      { label: '사용 시간', value: `${draft.leave.reservedHours}시간` },
      { label: '기안 내용', value: draft.content },
    ]
  }
  if (isBusinessTripDraft(draft) && draft.businessTrip) {
    return [
      {
        label: '출장 기간',
        value: `${formatDraftDateTime(draft.businessTrip.startAt)} ~ ${formatDraftDateTime(draft.businessTrip.endAt)}`,
      },
      { label: '목적지', value: draft.businessTrip.destination },
      { label: '목적', value: draft.businessTrip.purpose },
      { label: '참여자', value: draft.businessTrip.participants.map((p) => p.empName).join(', ') },
      { label: '기안 내용', value: draft.content },
    ]
  }
  if (isSalesDraft(draft) && draft.sales) {
    return [
      { label: '대상 가맹점', value: draft.sales.franchiseName },
      { label: '매출 보고월', value: draft.sales.reportMonth },
      { label: '매출액', value: `${draft.sales.salesAmount.toLocaleString('ko-KR')}원` },
      { label: '기안 내용', value: draft.content },
    ]
  }
  return [{ label: '기안 내용', value: draft.content }]
}

export function DraftPrintPreviewPage() {
  const { draftId: draftIdParam } = useParams()
  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined
  const isInvalidDraftId = draftId === undefined

  const detailQuery = useDraftDetailQuery(draftId)

  if (isInvalidDraftId) {
    return <p className="p-6 text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
  }

  if (detailQuery.isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">기안서를 불러오는 중...</p>
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return <p className="p-6 text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
    }
    if (isForbidden(apiError)) {
      return <p className="p-6 text-sm text-muted-foreground">이 기안서를 조회할 권한이 없습니다.</p>
    }
    return <p className="p-6 text-sm text-muted-foreground">기안서를 불러오지 못했습니다.</p>
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data
  const approvers = [...draft.approvers].sort((a, b) => a.order - b.order)
  const bodyFields = resolveBodyFields(draft)
  const statusCode = resolveApprovalStatus(draft.approvalStatus)

  const drafterColumn: PrintApprovalColumn = {
    header: '기안',
    name: draft.drafter.empName,
    mark:
      draft.submittedAt != null
        ? { kind: 'signature', variant: 'drafter', status: '상신' }
        : { kind: 'stamp', label: '작성', tone: 'draft' },
    date: draft.submittedAt != null ? dayjs(draft.submittedAt).format('MM-DD') : '-',
  }
  const approverColumns = approvers.map((approver, index): PrintApprovalColumn => {
    const mark: PrintApprovalMark =
      approver.approvedAt != null
        ? { kind: 'signature', variant: 'reviewer', status: '승인' }
        : approver.rejectedAt != null
          ? { kind: 'stamp', label: '반려', tone: 'rejected' }
          : { kind: 'stamp', label: '예정', tone: 'pending' }
    const date =
      approver.approvedAt != null
        ? dayjs(approver.approvedAt).format('MM-DD')
        : approver.rejectedAt != null
          ? dayjs(approver.rejectedAt).format('MM-DD')
          : '-'
    return {
      header: `${getApprovalRoleLabel(approver.role)}${index + 1}`,
      name: approver.empName,
      mark,
      date,
    }
  })

  const lastApprover = approvers.length > 0 ? approvers[approvers.length - 1] : undefined
  const companyStamp =
    statusCode === 'APPROVED' && lastApprover
      ? { name: lastApprover.empName, status: '승인' }
      : null

  const circulationText =
    draft.circulations.length > 0
      ? draft.circulations
          .map((circulation) => `${circulation.empName}(${circulation.readAt != null ? '읽음' : '미열람'})`)
          .join(', ')
      : null

  const documentYear = draft.submittedAt != null ? dayjs(draft.submittedAt).year() : dayjs().year()

  return (
    <DraftPrintDocument
      documentNumber={`HARUON-${documentYear}-${draft.draftId}`}
      retentionPeriod="5년"
      draftDate={draft.submittedAt != null ? dayjs(draft.submittedAt).format('YYYY-MM-DD') : '-'}
      draftDept="-"
      drafterName={draft.drafter.empName}
      documentType={getDraftTypeMeta(resolveDraftTypeKey(draft)).label}
      processingDeadline="-"
      title={draft.title}
      approvalColumns={[drafterColumn, ...approverColumns]}
      content={draft.content}
      detailFields={bodyFields.filter((field) => field.label !== '기안 내용')}
      attachments={draft.files.map((file) => file.originalName)}
      companyStamp={companyStamp}
      circulationText={circulationText}
    />
  )
}
