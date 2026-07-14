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

/**
 * 기안서 상세 페이지(F701, ROADMAP(DRAFT) T2.3, docs/prd/7.approval-common-prd.md §기안서 상세 페이지).
 *
 * 4종 문서함(M1) 행 클릭 또는 직접 URL(`/approval/drafts/:draftId`, T2.5 등록)로 진입하는 read-only
 * 상세 화면이다. 이 페이지는 조회(useDraftDetailQuery)·라우트 파라미터 검증·로딩/에러 분기만 담당하고,
 * 화면 각 영역은 **영역별 슬롯 컴포넌트(components/detail/*)를 조립만** 한다 — M3(결재자 액션)·
 * M4(기안자 액션)·M5(공람)·M6(첨부)이 각자 자기 슬롯 파일에서 기능을 얹어 병렬 편집 충돌을 피한다.
 * 슬롯 공통 props 계약은 components/detail/types.ts(DraftDetailSectionProps `{ draft }`) 참조.
 *
 * 레이아웃(레퍼런스 기안서 상세보기 이식): 상단 액션 바(좌 문서함 복귀 / 우 인쇄·PDF·기안자/결재자
 * 액션) + 2열 그리드 — 좌측 문서 카드(헤더 + 메타 4칸 + 기안 내용 박스), 우측 사이드 카드 스택
 * (결재선·첨부파일·공람·처리 이력). 모바일~lg는 1열로 쌓인다.
 *
 * 조회 실패 처리(PRD §접근 권한, apiError 매핑 소비·reissue 금지): not-found(404)·forbidden(403)은
 * 전용 안내 UX로 렌더하고, 그 외 실패만 토스트로 알린다(BoardDetailPage 컨벤션 복제). 조회 가능자가
 * 아니면 서버가 403/도메인 에러를 반환하며, 처리는 에러코드에 의존하지 않는다.
 */
export function DraftDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { draftId: draftIdParam } = useParams()
  // route param은 신뢰 불가 입력이다(BoardDetailPage와 동일 가드): 순수 10진 양의 정수 형식만
  // 허용해 지수/16진수/음수 표기가 다른 기안서로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = draftIdParam !== undefined && /^[1-9][0-9]*$/.test(draftIdParam)
  const draftId = isDecimalPositiveInteger ? Number(draftIdParam) : undefined
  const isInvalidDraftId = draftId === undefined

  const detailQuery = useDraftDetailQuery(draftId)

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  // 뒤로가기: in-app 히스토리가 있으면 navigate(-1)로 직전 문서함으로 복귀하고, 없으면(직접 URL·새 탭
  // 진입 — React Router v7 useLocation().key가 초기 엔트리에서 'default') 결재함(모든 조회 가능 문서의
  // 상위 목록이라 어떤 유형 기안이든 자연스러운 복귀점)으로 이동한다. 직접 진입도 지원 경로라 navigate(-1)
  // 단독은 앱 밖 이탈/무동작 dead-end가 될 수 있어 fallback을 둔다.
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
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-3">
        <div className="mb-4">{backButton}</div>
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
        <p className="text-sm text-muted-foreground">기안서를 불러오지 못했습니다.</p>
      </div>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!detailQuery.data) {
    return null
  }

  const draft = detailQuery.data

  return (
    // 좌측 문서 카드가 뷰포트 남는 높이를 채우도록 페이지를 세로 플렉스(min-h-full)로 둔다.
    <div className="flex min-h-full w-full flex-col p-3">
      {/* 상단 액션 바(레퍼런스): 좌 문서함 복귀 / 우 인쇄 미리보기·기안자/결재자 액션. */}
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

      {/* 2열 그리드(레퍼런스 xl 8:4): 좌 문서 카드 / 우 사이드 카드 스택. lg 이하는 1열.
          flex-1 + items-stretch로 그리드 행이 남는 세로 공간을 채우고, 좌측 문서 카드가 그 높이만큼
          늘어나 기안 내용 박스가 카드를 꽉 채운다(사용자 요청 2026-07-14). */}
      <div className="grid flex-1 grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="flex min-w-0 flex-col rounded-2xl">
          <CardHeader className="border-b">
            <DraftDetailHeader draft={draft} />
          </CardHeader>

          <CardContent className="flex flex-1 flex-col space-y-6">
            {/* 문서 메타 4칸(레퍼런스: 문서번호·기안자·상신일시·보존연한). 기안자 부서/직급은
                DRAFT_DETAIL 계약에 없어 이름만 표기한다(발명 금지). 보존연한은 문서 양식 고정값. */}
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

            {/* 기안 내용: 유형별 본문 슬롯(T2.4)을 레퍼런스처럼 옅은 박스로 감싼다. flex-1로 카드가
                늘어난 만큼 내용 박스가 함께 늘어나 카드 하단까지 꽉 채운다(min-h는 짧은 본문 바닥값). */}
            <section className="flex flex-1 flex-col space-y-3">
              <h3 className="shrink-0 text-base font-bold text-foreground">기안 내용</h3>
              <div className="min-h-[320px] flex-1 rounded-2xl bg-muted/40 p-4 sm:p-7">
                <DraftTypeBody draft={draft} />
              </div>
            </section>
          </CardContent>
        </Card>

        {/* 사이드 카드 스택(레퍼런스: 결재선·첨부파일·처리 이력 + 이 앱 고유의 공람). */}
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
