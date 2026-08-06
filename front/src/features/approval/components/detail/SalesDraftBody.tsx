import dayjs from 'dayjs'
import type { DraftDetailSectionProps } from './types'

function formatSalesAmount(amount: number): string {
  return `${new Intl.NumberFormat('ko-KR').format(amount)}원`
}

function formatReportMonth(reportMonth: string): string {
  return dayjs(`${reportMonth}-01`).format('YYYY년 M월')
}

export function SalesDraftBody({ draft }: DraftDetailSectionProps) {
  const { sales } = draft

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
