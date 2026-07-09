import { formatDraftDateTime } from '../../lib/approvalStatusBadge'
import { leaveTypeLabels, type LeaveType } from '../../model/leaveDraftSchema'
import type { DraftDetailSectionProps } from './types'

/**
 * `LeaveSlot.leaveType`은 DTO 상 plain string(백엔드가 미확정 값을 내려줄 가능성에 대비한 방어적
 * 타입)이라 `leaveTypeLabels`(Record<LeaveType,string>) 인덱싱 전에 계약 밖 값을 안전하게
 * 폴백한다(발명 라벨 없이 원문 코드 그대로 표시).
 */
function resolveLeaveTypeLabel(leaveType: string): string {
  return leaveTypeLabels[leaveType as LeaveType] ?? leaveType
}

/**
 * 휴가 기안 상세 본문(F741, ROADMAP(LEAVE) T2.2).
 *
 * `DraftTypeBody`(①선례)의 `draft.leave != null` "준비 중" 폴백을 교체한다. 신규 조회 없이
 * `DRAFT_DETAIL`(F701, ①)이 이미 내려준 `leave` 슬롯(`LeaveSlot`, T2.1)과 공통 `content`를
 * 렌더한다 — 기간은 dayjs 포맷(`formatDraftDateTime`, ①선례 재사용), 유형은 enum 코드를
 * `leaveTypeLabels`로 변환한다. `BusinessTripDraftBody`와 달리 참여자·mutation이 없는 순수
 * read-only 본문이다(연가 슬롯 수정은 이 화면이 아니라 [수정] 버튼으로 진입하는 별도 수정
 * 페이지, T2.4가 담당).
 */
export function LeaveDraftBody({ draft }: DraftDetailSectionProps) {
  const { leave } = draft

  // DraftTypeBody가 이미 leave != null일 때만 이 컴포넌트를 렌더하지만, 타입상 LeaveSlot | null이라
  // 방어적으로 좁힌다(BusinessTripDraftBody 동형 — 호출부 계약 위반 시 조용히 아무것도 렌더하지 않음).
  if (leave == null) {
    return null
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">휴가 유형</dt>
          <dd className="text-sm text-foreground">{resolveLeaveTypeLabel(leave.leaveType)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">휴가 기간</dt>
          <dd className="text-sm text-foreground">
            {formatDraftDateTime(leave.startAt)} ~ {formatDraftDateTime(leave.endAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">사용 시간</dt>
          <dd className="text-sm text-foreground">{leave.reservedHours}시간</dd>
        </div>
      </dl>

      <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {draft.content}
      </p>
    </div>
  )
}
