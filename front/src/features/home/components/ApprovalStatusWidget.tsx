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
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

const WIDGET_ITEM_LIMIT = 3
// 상신함 응답에서 진행성 상태(WAITING/IN_PROGRESS/REJECTED)만 클라이언트 필터하므로, 필터 후에도
// 상위 3건이 남을 확률을 높이기 위해 넉넉히 조회한다(계획 문서 §재사용 자원 맵).
const SUBMITTED_FETCH_SIZE = 10

type ApprovalTab = 'submitted' | 'pending'

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
        <Inbox />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

/**
 * 전자결재 현황 위젯(레퍼런스 dashboard-roles.html "전자결재 현황" 2분할 세그먼트 이식).
 * 기존 PendingApprovalWidget(결재 대기만 단일 표시)을 대체한다 — "내 상신 진행"·"내 결재 대기"
 * 두 탭으로 확장했다(계획 문서 §재사용 자원 맵).
 *
 * "내 상신 진행" 탭은 상신함(MY_SUBMITTED_DRAFTS) 응답에서 approvalStatus가 WAITING/IN_PROGRESS/
 * REJECTED인 것만 클라이언트 필터한다(APPROVED 제외 — 완료 건은 "진행"이 아니므로). 목록 응답에는
 * draftType이 없어(DocumentBoxRow 실측) 레퍼런스의 유형 뱃지(휴가/일반/출장/매출)·결재 진행
 * 단계(2/3 등)는 표시하지 않는다(계약에 없는 정보 발명 금지).
 */
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
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
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
      <CardContent className="flex flex-col gap-3">
        {activeItems.length === 0 ? (
          <EmptyState
            message={tab === 'submitted' ? '진행 중인 상신 문서가 없습니다.' : '결재 대기 중인 문서가 없습니다.'}
          />
        ) : (
          <div className="w-full overflow-x-auto">
            {/* 탭별로 열을 달리한다: 상신 탭은 기안자=본인이라 상태를, 결재대기 탭은 상태=항상 대기라
                기안자를 두 번째 열에 둔다(레퍼런스 패널별 컬럼 구성 + 중복 정보 제거). */}
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
        <Link
          to={moreLink}
          className="inline-flex items-center gap-1 self-end text-sm font-medium text-primary hover:underline"
        >
          문서함 전체 보기
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
