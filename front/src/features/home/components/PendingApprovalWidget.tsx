import { Link } from 'react-router'
import { ChevronRight, ClipboardList, Inbox } from 'lucide-react'
import { useMyPendingApprovalDraftsQuery } from '@/features/approval/api/useMyPendingApprovalDraftsQuery'
import { formatDraftDateTime, getApprovalStatusBadge } from '@/features/approval/lib/approvalStatusBadge'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 3

/**
 * 결재 대기함 위젯(레퍼런스 dashboard/index.tsx "결재 대기목록" 섹션 이식, F710
 * MY_PENDING_APPROVAL_DRAFTS 재사용 — DocumentBoxHomePage 'pending' 탭과 동일 소스).
 * 상위 3건만 노출하고, 항목 클릭 시 기안서 상세(DraftDetailPage)로 이동한다.
 */
export function PendingApprovalWidget() {
  const { data } = useMyPendingApprovalDraftsQuery({ page: 0, size: WIDGET_ITEM_LIMIT })
  const items = data?.content ?? []

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
            <ClipboardList />
          </span>
          <div>
            <CardTitle>결재 대기함</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              내가 바로 확인해야 하는 결재 문서입니다.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {data?.totalElements ?? 0}건
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <Inbox />
            </span>
            <p className="text-sm text-muted-foreground">결재 대기 중인 문서가 없습니다.</p>
          </div>
        ) : (
          items.map((item) => {
            const badge = getApprovalStatusBadge(item.approvalStatus)
            return (
              <Link
                key={item.draftId}
                to={`/approval/drafts/${item.draftId}`}
                className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{item.draftTitle}</p>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.drafterName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDraftDateTime(item.submittedAt)}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
