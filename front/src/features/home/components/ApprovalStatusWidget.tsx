import { useState } from 'react'
import dayjs from 'dayjs'
import { Link, useNavigate } from 'react-router'
import { ArrowRight, ClipboardList, Inbox } from 'lucide-react'
import { useMyPendingApprovalDraftsQuery } from '@/features/approval/api/useMyPendingApprovalDraftsQuery'
import { useMySubmittedDraftsQuery } from '@/features/approval/api/useMySubmittedDraftsQuery'
import {
  getApprovalStatusBadge,
  resolveApprovalStatus,
} from '@/features/approval/lib/approvalStatusBadge'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const WIDGET_ITEM_LIMIT = 3
const SUBMITTED_FETCH_SIZE = 10

type ApprovalTab = 'submitted' | 'pending'

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        <Inbox />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function ApprovalStatusWidget() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ApprovalTab>('submitted')

  const submittedQuery = useMySubmittedDraftsQuery({ page: 0, size: SUBMITTED_FETCH_SIZE })
  const pendingQuery = useMyPendingApprovalDraftsQuery({ page: 0, size: WIDGET_ITEM_LIMIT })

  const submittedItems = (submittedQuery.data?.content ?? [])
    .filter((item) => {
      const code = resolveApprovalStatus(item.approvalStatus)
      return code === 'WAITING' || code === 'IN_PROGRESS' || code === 'REJECTED'
    })
    .slice(0, WIDGET_ITEM_LIMIT)
  const pendingItems = pendingQuery.data?.content ?? []

  const activeItems = tab === 'submitted' ? submittedItems : pendingItems
  const moreLink = tab === 'submitted' ? '/approval/box/submitted' : '/approval/box/pending'

  return (
    <Card className="h-[420px]">
      <CardHeader className="flex shrink-0 flex-col items-start gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
            <ClipboardList />
          </span>
          <div>
            <CardTitle>전자결재 현황</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">내 상신함 · 내 결재 대기</p>
          </div>
        </div>
        <Tabs value={tab} onValueChange={(value) => setTab(value as ApprovalTab)}>
          <TabsList>
            <TabsTrigger value="submitted">
              내 상신 진행
              <span className="rounded bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                {submittedItems.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="pending">
              내 결재 대기
              <span className="rounded bg-foreground/10 px-1.5 text-[11px] font-semibold tabular-nums">
                {pendingItems.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {activeItems.length === 0 ? (
          <EmptyState
            message={tab === 'submitted' ? '진행 중인 상신 문서가 없습니다.' : '결재 대기 중인 문서가 없습니다.'}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    제목
                  </th>
                  <th className="w-24 px-3 py-2.5 text-left text-xs font-medium whitespace-nowrap text-muted-foreground">
                    {tab === 'submitted' ? '상태' : '기안자'}
                  </th>
                  <th className="w-28 px-3 py-2.5 text-right text-xs font-medium whitespace-nowrap text-muted-foreground">
                    상신일
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => {
                  const badge = getApprovalStatusBadge(item.approvalStatus)
                  const goToDraft = () => navigate(`/approval/drafts/${item.draftId}`)
                  return (
                    <tr
                      key={item.draftId}
                      role="button"
                      tabIndex={0}
                      onClick={goToDraft}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') goToDraft()
                      }}
                      className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    >
                      <td className="truncate px-3 py-3 font-medium">{item.draftTitle}</td>
                      <td className="truncate px-3 py-3 whitespace-nowrap">
                        {tab === 'submitted' ? (
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        ) : (
                          <span className="text-muted-foreground">{item.drafterName}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap text-muted-foreground">
                        {item.submittedAt ? dayjs(item.submittedAt).format('MM-DD HH:mm') : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          to={moreLink}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          문서함 전체 보기
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
