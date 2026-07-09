import { BusinessTripDraftBody } from './BusinessTripDraftBody'
import { LeaveDraftBody } from './LeaveDraftBody'
import type { DraftDetailSectionProps } from './types'

/**
 * 유형별 본문 슬롯 분기(ROADMAP(DRAFT) T2.4, ROADMAP(DRAFT-BUSINESSTRIP) T3.1, ROADMAP(LEAVE) T2.2).
 *
 * 유형 판별은 `draftType` enum 값이 아니라 **`leave`/`businessTrip`/`sales` non-null 슬롯 체크**로
 * 한다(Open Q#2 회피 — draftType 정규 enum 값 집합 미확정). 슬롯 계약:
 * - 셋 다 null(GENERAL) → 공통 `content`만 렌더.
 * - `leave` non-null(휴가) → `LeaveDraftBody`(④연가 PRD 소유)가 실제 본문을 렌더한다.
 * - `businessTrip` non-null(출장) → `BusinessTripDraftBody`(③출장 PRD 소유)가 실제 본문을 렌더한다.
 * - `sales` non-null → 본문은 ⑤매출 작성 PRD가 소유하므로, 아직은 "해당 유형 화면 준비 중" 폴백으로
 *   처리한다(Open Q#3). 본문 컴포넌트가 준비되면 이 분기에서 해당 컴포넌트를 렌더하도록 교체한다
 *   (확장 포인트).
 *
 * 취소기안 여부(sourceDraftId)는 본문 분기에 영향을 주지 않는다 — 원본 링크는 DraftDetailHeader가
 * 표시하고, 취소기안의 본문도 위 슬롯 규칙(대개 GENERAL=content)을 그대로 따른다.
 */

/** 미구현 유형 슬롯 폴백(Open Q#3). typeName은 사용자 표시용 유형명. */
function TypeSlotFallback({ typeName }: { typeName: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      {typeName} 기안 본문 화면은 준비 중입니다.
    </div>
  )
}

export function DraftTypeBody({ draft }: DraftDetailSectionProps) {
  if (draft.leave != null) {
    return <LeaveDraftBody draft={draft} />
  }
  if (draft.businessTrip != null) {
    return <BusinessTripDraftBody draft={draft} />
  }
  if (draft.sales != null) {
    return <TypeSlotFallback typeName="매출" />
  }

  // GENERAL(유형 슬롯 없음): 공통 본문만 렌더. 순수 텍스트이므로 dangerouslySetInnerHTML 없이
  // whitespace-pre-wrap으로 줄바꿈만 보존한다(BoardDetailPage 본문 렌더 톤 유지).
  return (
    <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
      {draft.content}
    </p>
  )
}
