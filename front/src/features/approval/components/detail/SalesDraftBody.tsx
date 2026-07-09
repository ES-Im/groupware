import dayjs from 'dayjs'
import type { DraftDetailSectionProps } from './types'

/** 매출액 천 단위 구분 표기(예: "1,000,000원"). PRD §기술 스택 지정(Intl은 네이티브 API — 신규 라이브러리 아님). */
function formatSalesAmount(amount: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(amount)}원`
}

/** `yyyy-MM` 보고월을 "2026년 7월" 형식으로 표기한다(dayjs, 일자 보정 후 포맷). */
function formatReportMonth(reportMonth: string): string {
  return dayjs(`${reportMonth}-01`).format('YYYY년 M월')
}

/**
 * 매출 기안 상세 본문(F761, ROADMAP(SALES) T3.2).
 *
 * `DraftTypeBody`(①선례)의 `draft.sales != null` "준비 중" 폴백을 교체한다. 신규 조회 없이
 * `DRAFT_DETAIL`(F701, ①)이 이미 내려준 `sales` 슬롯(`SalesSlot`, T3.1)과 공통 `content`를
 * 렌더한다 — 매출액은 천 단위 구분, 보고월은 dayjs 포맷. `LeaveDraftBody`와 동형으로 참여자·
 * mutation이 없는 순수 read-only 본문이다(매출 슬롯 수정은 이 화면이 아니라 [수정] 버튼으로
 * 진입하는 별도 수정 페이지, `SalesDraftEditPage`가 담당).
 */
export function SalesDraftBody({ draft }: DraftDetailSectionProps) {
  const { sales } = draft

  // DraftTypeBody가 이미 sales != null일 때만 이 컴포넌트를 렌더하지만, 타입상 SalesSlot | null이라
  // 방어적으로 좁힌다(LeaveDraftBody 동형 — 호출부 계약 위반 시 조용히 아무것도 렌더하지 않음).
  if (sales == null) {
    return null
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">대상 가맹점</dt>
          <dd className="text-sm text-foreground">{sales.franchiseName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">매출 보고월</dt>
          <dd className="text-sm text-foreground">{formatReportMonth(sales.reportMonth)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">매출액</dt>
          <dd className="text-sm text-foreground">{formatSalesAmount(sales.salesAmount)}</dd>
        </div>
      </dl>

      <p className="min-h-24 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
        {draft.content}
      </p>
    </div>
  )
}
