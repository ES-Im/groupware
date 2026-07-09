import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { Card, CardContent } from '@/shared/ui/card'
import { useMyDocumentBoxSummaryQuery } from '../api/useMyDocumentBoxSummaryQuery'
import type { MyDocumentBoxSummary } from '../model/approval'

/**
 * 문서함 홈 요약 카드 4종 정의(F715). 각 카드는 라벨 + 건수(summary selector) + 이동 경로(M1 4종
 * 문서함 라우트)를 갖는다. 결재대기 카드(emphasized)는 사용자가 처리해야 할 액션 문서라 시각적으로
 * 강조한다(§페이지별 상세 "결재대기 강조", F711). pendingApprovalDraftCount는 F711(사이드바 뱃지)과
 * 동일 축의 값이라 홈에서는 요약값을 그대로 쓰고 F711 단건 조회를 중복 호출하지 않는다.
 */
const SUMMARY_CARDS: {
  key: string
  label: string
  description: string
  to: string
  getValue: (summary: MyDocumentBoxSummary) => number
  emphasized?: boolean
}[] = [
  {
    key: 'pending',
    label: '결재대기',
    description: '내 결재 차례 문서',
    to: '/approval/box/pending',
    getValue: (s) => s.pendingApprovalDraftCount,
    emphasized: true,
  },
  {
    key: 'unsubmitted',
    label: '임시저장',
    description: '상신 전 내 기안',
    to: '/approval/box/unsubmitted',
    getValue: (s) => s.unsubmittedDraftCount,
  },
  {
    key: 'submitted',
    label: '상신',
    description: '내가 상신한 기안',
    to: '/approval/box/submitted',
    getValue: (s) => s.submittedDraftCount,
  },
  {
    key: 'accessible',
    label: '조회가능',
    description: '내가 조회할 수 있는 문서',
    to: '/approval/box/accessible',
    getValue: (s) => s.accessibleDocumentCount,
  },
]

/**
 * 문서함 홈(요약) 페이지(F715, ROADMAP(DRAFT) T7.2, docs/prd/7.approval-common-prd.md §문서함 홈 페이지).
 * 4종 문서함 건수 요약(useMyDocumentBoxSummaryQuery, F715)을 카드로 보여주고, 카드 클릭 시 해당
 * 문서함(M1 4종 라우트)으로 이동한다. 조회 실패는 attendance/문서함 목록 컨벤션대로 handleApiError로
 * 토스트한다(not-found 전용 UX 없음 → 단일 진입점).
 *
 * 카드는 키보드 접근성을 위해 <button>으로 렌더한다(Enter/Space 기본 처리 — DocumentBoxTable의 role
 * 수동 배선 대신 네이티브 시맨틱 사용). 로딩 중에는 건수 자리에 스켈레톤 바를, 조회 실패 시에는 "-"를
 * 표시한다(AttendanceSummaryCard 톤 복제 — 실패 안내는 토스트가 담당).
 */
export function DocumentBoxHomePage() {
  const navigate = useNavigate()
  const summaryQuery = useMyDocumentBoxSummaryQuery()

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  const summary = summaryQuery.data

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">문서함 홈</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          문서함 건수를 확인하고 카드를 눌러 해당 문서함으로 이동합니다.
        </p>
      </div>

      <section
        aria-label="문서함 요약"
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        {SUMMARY_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => navigate(card.to)}
            className="group rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
          >
            <Card
              size="sm"
              className={cn(
                'h-full transition-colors group-hover:bg-muted/40',
                card.emphasized && 'bg-primary/5 ring-primary/30 group-hover:bg-primary/10',
              )}
            >
              <CardContent className="flex min-w-0 flex-col gap-1.5">
                <p className="truncate text-xs text-muted-foreground">{card.label}</p>
                {summaryQuery.isLoading ? (
                  <span className="h-8 w-16 animate-pulse rounded-md bg-muted" aria-hidden />
                ) : (
                  <p
                    className={cn(
                      'truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground',
                      card.emphasized && 'text-primary',
                    )}
                  >
                    {summary ? card.getValue(summary) : '-'}
                  </p>
                )}
                <p className="truncate text-xs text-muted-foreground/80">{card.description}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>
    </div>
  )
}
