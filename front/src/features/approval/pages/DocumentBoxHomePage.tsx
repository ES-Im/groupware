import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import {
  ArrowUpRight,
  FilePen,
  FilePlus,
  FolderCheck,
  Search,
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
import { Input } from '@/shared/ui/input'
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

type DocumentBoxListQueryHook = (
  params: DocumentBoxQueryParams,
) => UseQueryResult<Page<DocumentBoxRow>>

interface BoxTabConfig {
  key: string
  navLabel: string
  cardLabel: string
  cardDescription: string
  icon: LucideIcon
  emphasized?: boolean
  iconTileClassName?: string
  useListQuery: DocumentBoxListQueryHook
  emptyMessage: string
  getValue: (summary: MyDocumentBoxSummary) => number
  getBadge?: (summary: MyDocumentBoxSummary) => number
}

const BOX_TABS: Record<string, BoxTabConfig> = {
  submitted: {
    key: 'submitted',
    navLabel: '상신함',
    cardLabel: '상신 문서',
    cardDescription: '내가 상신한 기안',
    icon: Send,
    iconTileClassName: 'bg-sky-100 text-sky-600',
    useListQuery: useMySubmittedDraftsQuery,
    emptyMessage: '상신한 기안이 없습니다.',
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
    getValue: (s) => s.pendingApprovalDraftCount,
    getBadge: (s) => s.pendingApprovalDraftCount,
  },
  accessible: {
    key: 'accessible',
    navLabel: '결재함',
    cardLabel: '결재함',
    cardDescription: '조회 가능 문서',
    icon: FolderCheck,
    iconTileClassName: 'bg-slate-100 text-slate-600',
    useListQuery: useMyAccessibleDocumentsQuery,
    emptyMessage: '조회 가능한 문서가 없습니다.',
    getValue: (s) => s.accessibleDocumentCount,
  },
  unsubmitted: {
    key: 'unsubmitted',
    navLabel: '임시저장함',
    cardLabel: '임시저장',
    cardDescription: '상신 전 문서',
    icon: FilePen,
    iconTileClassName: 'bg-amber-100 text-amber-600',
    useListQuery: useMyUnsubmittedDraftsQuery,
    emptyMessage: '임시저장한 기안이 없습니다.',
    getValue: (s) => s.unsubmittedDraftCount,
    getBadge: (s) => s.unsubmittedDraftCount,
  },
}

const CARD_ORDER = ['pending', 'unsubmitted', 'submitted', 'accessible'] as const

const TAB_ORDER = ['submitted', 'pending', 'accessible', 'unsubmitted'] as const

export function DocumentBoxHomePage() {
  const navigate = useNavigate()
  const { tab } = useParams<{ tab: string }>()
  const summaryQuery = useMyDocumentBoxSummaryQuery()
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    if (!summaryQuery.error) {
      return
    }
    handleApiError(summaryQuery.error, { toast })
  }, [summaryQuery.error])

  const summary = summaryQuery.data
  const isValidTab = tab != null && tab in BOX_TABS

  if (!isValidTab) {
    return <Navigate to="/approval/box/pending" replace />
  }

  const activeTab = tab
  const searchInputId = `${activeTab}-search`

  return (
    <div className="flex min-h-full w-full flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">문서함 요약</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            내 결재 대기·상신·임시저장 문서를 한 곳에서 관리하세요
          </p>
        </div>
        <Button
          type="button"
          onClick={() => navigate('/approval/drafts/new')}
          className="w-full rounded-xl shadow-lg shadow-primary/20 sm:w-auto"
        >
          <FilePlus />
          새 기안서 작성
        </Button>
      </header>

      <section
        aria-label="문서함 요약 카드"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CARD_ORDER.map((key) => {
          const card = BOX_TABS[key]
          const Icon = card.icon
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setSearchValue('')
                navigate(`/approval/box/${key}`)
              }}
              aria-current={activeTab === key ? 'true' : undefined}
              className="group rounded-2xl text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              <Card
                className={cn(
                  'h-full rounded-2xl transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md',
                  card.emphasized && 'bg-primary/5 ring-primary/20 group-hover:bg-primary/10',
                  activeTab === key && 'ring-2 ring-primary/40',
                )}
              >
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground',
                        card.emphasized ? 'bg-primary/10 text-primary' : card.iconTileClassName,
                      )}
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-muted-foreground">
                      {card.cardLabel}
                    </p>
                    {summaryQuery.isLoading ? (
                      <span
                        className="mt-1.5 block h-8 w-16 animate-pulse rounded-md bg-muted"
                        aria-hidden
                      />
                    ) : (
                      <p
                        className={cn(
                          'mt-0.5 flex items-baseline gap-1 truncate text-3xl font-bold tracking-tight tabular-nums text-foreground',
                          card.emphasized && 'text-primary',
                        )}
                      >
                        {summary ? card.getValue(summary) : '-'}
                        <span className="text-sm font-normal text-muted-foreground">건</span>
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

      <Card className="flex min-h-[540px] flex-1 flex-col gap-0 rounded-2xl py-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setSearchValue('')
            navigate(`/approval/box/${value}`)
          }}
          className="flex flex-1 flex-col gap-0"
        >
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 overflow-x-auto">
              <TabsList variant="line" className="justify-start">
                {TAB_ORDER.map((key) => {
                  const tabConfig = BOX_TABS[key]
                  const Icon = tabConfig.icon
                  const badge =
                    tabConfig.getBadge && summary ? tabConfig.getBadge(summary) : 0
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="flex-none data-active:text-primary after:bg-primary"
                    >
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
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor={searchInputId} className="sr-only">
                제목 검색
              </label>
              <Input
                id={searchInputId}
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="제목으로 검색"
                className="rounded-lg pl-8"
              />
            </div>
          </div>

          {TAB_ORDER.map((key) => {
            const tabConfig = BOX_TABS[key]
            return (
              <TabsContent key={key} value={key} className="flex flex-1 flex-col p-4">
                <DocumentBoxTable
                  useListQuery={tabConfig.useListQuery}
                  emptyMessage={tabConfig.emptyMessage}
                  searchValue={searchValue}
                  onRowClick={(draftId) => navigate(`/approval/drafts/${draftId}`)}
                />
              </TabsContent>
            )
          })}
        </Tabs>
      </Card>
    </div>
  )
}
