import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { formatDraftDateTime } from '../lib/approvalStatusBadge'
import { ApprovalLineTimeline } from '../components/detail/ApprovalLineTimeline'
import { ApproverActions } from '../components/detail/ApproverActions'
import { AttachmentSection } from '../components/detail/AttachmentSection'
import { CirculationSection } from '../components/detail/CirculationSection'
import { DraftDetailHeader } from '../components/detail/DraftDetailHeader'
import { DraftHistorySection } from '../components/detail/DraftHistorySection'
import { DraftTypeBody } from '../components/detail/DraftTypeBody'
import { DrafterActions } from '../components/detail/DrafterActions'

export function DraftDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { draftId: draftIdParam } = useParams()
  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined
  const isInvalidDraftId = draftId === undefined

  const detailQuery = useDraftDetailQuery(draftId)

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  function handleBack() {
    if (location.key === 'default') {
      navigate('/approval/box/accessible')
    } else {
      navigate(-1)
    }
  }

  const backButton = (
    <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={handleBack}>
      <ArrowLeft />
      문서함
    </Button>
  )

  if (isInvalidDraftId) {
    return (
      <div className="w-full p-3">
        <div className="mb-4">{backButton}</div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="w-full p-3">
        <div className="mb-4">{backButton}</div>
        <p className="text-sm text-muted-foreground">기안서를 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-3">
          <div className="mb-4">{backButton}</div>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
          <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="w-full p-3">
          <div className="mb-4">{backButton}</div>
          <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
          <p className="text-sm text-muted-foreground">이 기안서를 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="w-full p-3">
        <div className="mb-4">{backButton}</div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
        <p className="text-sm text-muted-foreground">기안서를 불러오지 못했습니다.</p>
      </div>
    )
  }

  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  return (
    <div className="flex min-h-full w-full flex-col p-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {backButton}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            onClick={() =>
              window.open(`/approval/drafts/${draftId}/print`, '_blank', 'noopener,noreferrer')
            }
          >
            <Printer />
            인쇄 미리보기
          </Button>
          <DrafterActions draft={draft} />
          <ApproverActions draft={draft} />
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col rounded-2xl">
          <CardHeader className="border-b">
            <DraftDetailHeader draft={draft} />
          </CardHeader>

          <CardContent className="flex flex-1 flex-col space-y-6">
            <dl className="-mx-4 grid shrink-0 grid-cols-2 gap-x-4 gap-y-4 border-y bg-muted/30 px-6 py-4 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">문서번호</dt>
                <dd className="mt-1 text-sm font-semibold">HARUON-DRAFT-{draft.draftId}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">기안자</dt>
                <dd className="mt-1 text-sm font-semibold">{draft.drafter.empName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">상신일시</dt>
                <dd className="mt-1 text-sm font-semibold tabular-nums">
                  {formatDraftDateTime(draft.submittedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">보존연한</dt>
                <dd className="mt-1 text-sm font-semibold">5년</dd>
              </div>
            </dl>

            <section className="flex flex-1 flex-col space-y-3">
              <h3 className="shrink-0 text-base font-bold text-foreground">기안 내용</h3>
              <div className="min-h-[320px] flex-1 rounded-2xl bg-muted/40 p-4 sm:p-7">
                <DraftTypeBody draft={draft} />
              </div>
            </section>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          <Card className="rounded-2xl">
            <CardContent>
              <ApprovalLineTimeline draft={draft} />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent>
              <AttachmentSection draft={draft} />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent>
              <CirculationSection draft={draft} />
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent>
              <DraftHistorySection draft={draft} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
