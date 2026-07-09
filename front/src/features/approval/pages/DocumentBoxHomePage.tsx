import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import {
  ArrowUpRight,
  FilePen,
  FilePlus,
  FolderCheck,
  Send,
  Stamp,
  type LucideIcon,
} from 'lucide-react'
import type { UseQueryResult } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useMyAccessibleDocumentsQuery } from '../api/useMyAccessibleDocumentsQuery'
import { useMyDocumentBoxSummaryQuery } from '../api/useMyDocumentBoxSummaryQuery'
import { useMyPendingApprovalDraftsQuery } from '../api/useMyPendingApprovalDraftsQuery'
import { useMySubmittedDraftsQuery } from '../api/useMySubmittedDraftsQuery'
import { useMyUnsubmittedDraftsQuery } from '../api/useMyUnsubmittedDraftsQuery'
import { DocumentBoxTable } from '../components/DocumentBoxTable'
import type {
  DocumentBoxQueryParams,
  DocumentBoxRow,
  MyDocumentBoxSummary,
  Page,
} from '../model/approval'

/**
 * 4종 문서함 목록 조회 훅 타입(DocumentBoxTable가 주입받는 것과 동일 시그니처).
 * keyword/page/size 파라미터를 받아 Page<DocumentBoxRow>를 반환한다.
 */
type DocumentBoxListQueryHook = (
  params: DocumentBoxQueryParams,
) => UseQueryResult<Page<DocumentBoxRow>>

interface BoxTabConfig {
  /** URL 세그먼트 겸 탭 value. */
  key: string
  /** 탭 트리거 라벨(상신함 등). */
  navLabel: string
  /** 요약 카드 라벨(상신 문서 등). */
  cardLabel: string
  /** 요약 카드 보조 설명. */
  cardDescription: string
  /** 카드/탭 공용 아이콘(모노크롬 톤). */
  icon: LucideIcon
  /** 결재대기 카드만 시각적으로 강조한다(사용자가 처리해야 할 액션 문서). */
  emphasized?: boolean
  /** 탭 목록에 주입할 조회 훅(고정 참조). */
  useListQuery: DocumentBoxListQueryHook
  /** 목록이 비었을 때 안내 문구. */
  emptyMessage: string
  /** 검색 입력 label/id 구분용 접두사. */
  searchId: string
  /** 요약값 selector(카드 건수). */
  getValue: (summary: MyDocumentBoxSummary) => number
  /** 탭 배지 selector(결재대기·임시저장만 노출). 없으면 배지 미표시. */
  getBadge?: (summary: MyDocumentBoxSummary) => number
}

/**
 * 문서함 탭 4종 정의(F710·F712·F713·F714·F715). 카드·탭·목록이 하나의 화면에서 공유하는 단일
 * 원천이다. tab 값(submitted/pending/accessible/unsubmitted)은 URL 세그먼트이자 Tabs value다.
 * 목록 조회 훅은 각 페이지가 최상위에서 import한 고정 참조 훅을 그대로 전달한다(DocumentBoxTable가
 * 마운트될 때 렌더 간 동일 참조 → 훅 호출 순서 안정, Rules of Hooks 준수).
 */
const BOX_TABS: Record<string, BoxTabConfig> = {
  submitted: {
    key: 'submitted',
    navLabel: '상신함',
    cardLabel: '상신 문서',
    cardDescription: '내가 상신한 기안',
    icon: Send,
    useListQuery: useMySubmittedDraftsQuery,
    emptyMessage: '상신한 기안이 없습니다.',
    searchId: 'submitted-drafts',
    getValue: (s) => s.submittedDraftCount,
  },
  pending: {
    key: 'pending',
    navLabel: '결재대기함',
    cardLabel: '결재 대기',
    cardDescription: '내 결재 차례 문서',
    icon: Stamp,
    emphasized: true,
    useListQuery: useMyPendingApprovalDraftsQuery,
    emptyMessage: '결재 대기 중인 문서가 없습니다.',
    searchId: 'pending-approval-drafts',
    getValue: (s) => s.pendingApprovalDraftCount,
    getBadge: (s) => s.pendingApprovalDraftCount,
  },
  accessible: {
    key: 'accessible',
    navLabel: '결재함',
    cardLabel: '결재함',
    cardDescription: '조회 가능 문서',
    icon: FolderCheck,
    useListQuery: useMyAccessibleDocumentsQuery,
    emptyMessage: '조회 가능한 문서가 없습니다.',
    searchId: 'accessible-documents',
    getValue: (s) => s.accessibleDocumentCount,
  },
  unsubmitted: {
    key: 'unsubmitted',
    navLabel: '임시저장함',
    cardLabel: '임시저장',
    cardDescription: '상신 전 문서',
    icon: FilePen,
    useListQuery: useMyUnsubmittedDraftsQuery,
    emptyMessage: '임시저장한 기안이 없습니다.',
    searchId: 'unsubmitted-drafts',
    getValue: (s) => s.unsubmittedDraftCount,
    getBadge: (s) => s.unsubmittedDraftCount,
  },
}

/** 요약 카드 노출 순서(결재 대기 → 임시저장 → 상신 문서 → 결재함). */
const CARD_ORDER = ['pending', 'unsubmitted', 'submitted', 'accessible'] as const

/** 탭 노출 순서(상신함 → 결재대기함 → 결재함 → 임시저장함). */
const TAB_ORDER = ['submitted', 'pending', 'accessible', 'unsubmitted'] as const

/**
 * 문서함 통합 화면(F715, docs/prd/7.approval-common-prd.md §문서함 홈 페이지).
 * 상단 요약 카드 4종(useMyDocumentBoxSummaryQuery) + 탭 4종(상신함/결재대기함/결재함/임시저장함)을
 * 하나의 화면에 통합한다. 탭 전환은 URL 세그먼트(/approval/box/:tab) 이동으로 구현되므로 카드 클릭·탭
 * 클릭 모두 해당 tab 라우트로 navigate한다. 활성 탭의 목록은 공용 DocumentBoxTable(검색·페이징·조회·
 * 에러 토스트 캡슐화)에 탭별 조회 훅만 주입해 렌더한다. 요약 조회 실패는 문서함 목록 컨벤션대로
 * handleApiError로 토스트한다.
 *
 * tab 세그먼트가 4종 밖이면 결재대기함(pending)으로 정규화한다(결재 대기가 가장 먼저 처리해야 할
 * 액션 문서라 기본 진입 탭). 훅은 조기 반환 전에 모두 호출해 Rules of Hooks를 지킨다.
 */
export function DocumentBoxHomePage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab: string }>()
  const summaryQuery = useMyDocumentBoxSummaryQuery()

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  const summary = summaryQuery.data
  const isValidTab = tab != null && tab in BOX_TABS

  // 유효하지 않은 tab은 기본 탭(결재대기함)으로 정규화한다 — URL을 정직하게 유지한다.
  if (!isValidTab) {
    return <Navigate to="/approval/box/pending" replace />
  }

  const activeTab = tab

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {/* 헤더: 페이지 타이틀 + 새 기안서 작성 진입 */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">문서함 요약</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            상신 및 결재 문서의 현재 처리 상태입니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => navigate('/approval/drafts/new')}
          className="w-full sm:w-auto"
        >
          <FilePlus />
          새 기안서 작성
        </Button>
      </header>

      {/* 요약 카드 4종: 클릭 시 해당 탭으로 이동(탭 전환과 동일한 진입점) */}
      <section
        aria-label="문서함 요약 카드"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
      >
        {CARD_ORDER.map((key) => {
          const card = BOX_TABS[key]
          const Icon = card.icon
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(`/approval/box/${key}`)}
              aria-current={activeTab === key ? 'true' : undefined}
              className="group rounded-xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <Card
                size="sm"
                className={cn(
                  'h-full transition-colors group-hover:bg-muted/40',
                  card.emphasized && 'bg-primary/5 group-hover:bg-primary/10',
                  activeTab === key && 'ring-2 ring-primary/40',
                )}
              >
                <CardContent className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground',
                      card.emphasized && 'bg-primary/10 text-primary',
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-muted-foreground">{card.cardLabel}</p>
                      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
                    </div>
                    {summaryQuery.isLoading ? (
                      <span
                        className="mt-1 block h-7 w-14 animate-pulse rounded-md bg-muted"
                        aria-hidden
                      />
                    ) : (
                      <p
                        className={cn(
                          'mt-0.5 flex items-baseline gap-1 truncate text-2xl font-semibold tracking-tight tabular-nums text-foreground',
                          card.emphasized && 'text-primary',
                        )}
                      >
                        {summary ? card.getValue(summary) : '-'}
                        <span className="text-xs font-normal text-muted-foreground">건</span>
                      </p>
                    )}
                    <p className="mt-0.5 truncate text-xs text-muted-foreground/80">
                      {card.cardDescription}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </section>

      {/* 탭 + 활성 탭 목록: 탭 전환은 URL 세그먼트 이동으로 구현된다 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => navigate(`/approval/box/${value}`)}
        className="mt-8"
      >
        <div className="overflow-x-auto border-b border-border pb-1.5">
          <TabsList variant="line" className="w-full justify-start">
            {TAB_ORDER.map((key) => {
              const tabConfig = BOX_TABS[key]
              const Icon = tabConfig.icon
              const badge =
                tabConfig.getBadge && summary ? tabConfig.getBadge(summary) : 0
              return (
                <TabsTrigger key={key} value={key} className="flex-none">
                  <Icon />
                  {tabConfig.navLabel}
                  {badge > 0 && (
                    <Badge variant="secondary" className="ml-1 tabular-nums">
                      {badge}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {TAB_ORDER.map((key) => {
          const tabConfig = BOX_TABS[key]
          return (
            <TabsContent key={key} value={key} className="mt-6">
              <DocumentBoxTable
                useListQuery={tabConfig.useListQuery}
                emptyMessage={tabConfig.emptyMessage}
                searchId={tabConfig.searchId}
                onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
              />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
