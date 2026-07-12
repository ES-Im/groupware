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

/** leaveType enum 코드 → 라벨. 계약 밖 값은 원문 그대로 표시한다(LeaveDraftBody 동형). */
function resolveLeaveTypeLabel(leaveType: string): string {
  return leaveTypeLabels[leaveType as LeaveType] ?? leaveType
}

/**
 * 유형별 본문 필드 목록(라벨+값). GENERAL은 공통 content만, 그 외 유형은 leave/businessTrip/sales
 * 슬롯 중 non-null인 것의 필드 + content. 판별은 기존 슬롯-null 판별 함수(isLeaveDraft 등, ①선례)를
 * 그대로 재사용한다(새 판별 로직 발명 금지).
 */
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


/**
 * 기안서 인쇄 미리보기 페이지(`/approval/drafts/:draftId/print`). 이미 상신된 기안서를 새 창에서
 * 인쇄 전용으로 보여준다 — LayoutShell 밖(사이드바/탑바 없음)이라 서버 재조회(useDraftDetailQuery)만
 * 하면 된다(sessionStorage 불필요, 작성 전 폼 값을 넘기는 DraftCreatePreviewPage와 다른 지점).
 *
 * draftId 파라미터 검증·로딩/not-found/forbidden 분기는 DraftDetailPage와 동일한 가드를 복제한다.
 * 문서 마크업은 공용 `DraftPrintDocument`(사기업 기안문 양식)에 위임하고, 이 페이지는 서버 상세를
 * 그 props 형태(결재란 열·상세 필드·회사명 도장·공람 등)로 정규화하는 책임만 진다.
 */
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
  // 서버 정렬을 신뢰하지 않고 order 오름차순으로 표시 정렬한다(ApprovalLineTimeline 동형).
  const approvers = [...draft.approvers].sort((a, b) => a.order - b.order)
  const bodyFields = resolveBodyFields(draft)
  const statusCode = resolveApprovalStatus(draft.approvalStatus)

  // 결재란 첫 열은 기안자. 상신 전(submittedAt null)이면 서명 대신 "작성" 동그라미로 둔다.
  const drafterColumn: PrintApprovalColumn = {
    header: '기안',
    name: draft.drafter.empName,
    mark:
      draft.submittedAt != null
        ? { kind: 'signature', variant: 'drafter', status: '상신' }
        : { kind: 'stamp', label: '작성', tone: 'draft' },
    date: draft.submittedAt != null ? dayjs(draft.submittedAt).format('MM-DD') : '-',
  }
  // 결재자 열: 승인=서명, 반려=붉은 동그라미, 미처리=회색 예정 동그라미. 헤더는 역할 라벨+순번.
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

  // 결재완료 상태면 마지막 결재자(order 최대) 서명을 회사명 우측 상단에 도장처럼 겹친다.
  const lastApprover = approvers.length > 0 ? approvers[approvers.length - 1] : undefined
  const companyStamp =
    statusCode === 'APPROVED' && lastApprover
      ? { name: lastApprover.empName, status: '승인' }
      : null

  // 공람: 비면 섹션을 생략하고, 있으면 "이름(읽음/미열람)" 한 줄로 압축한다(데이터 보존).
  const circulationText =
    draft.circulations.length > 0
      ? draft.circulations
          .map((circulation) => `${circulation.empName}(${circulation.readAt != null ? '읽음' : '미열람'})`)
          .join(', ')
      : null

  // 문서번호: 상신 연도(미상신이면 올해) + draftId. 기안일자는 상신일(미상신 "-"). 기안부서 데이터 없음.
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
