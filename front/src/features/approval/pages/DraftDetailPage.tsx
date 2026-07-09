import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { useDraftDetailQuery } from '../api/useDraftDetailQuery'
import { ApprovalLineTimeline } from '../components/detail/ApprovalLineTimeline'
import { ApproverActions } from '../components/detail/ApproverActions'
import { AttachmentSection } from '../components/detail/AttachmentSection'
import { CirculationSection } from '../components/detail/CirculationSection'
import { DraftDetailHeader } from '../components/detail/DraftDetailHeader'
import { DraftTypeBody } from '../components/detail/DraftTypeBody'
import { DrafterActions } from '../components/detail/DrafterActions'

/**
 * 기안서 상세 페이지(F701, ROADMAP(DRAFT) T2.3, docs/prd/7.approval-common-prd.md §기안서 상세 페이지).
 *
 * 4종 문서함(M1) 행 클릭 또는 직접 URL(`/approval/drafts/:draftId`, T2.5 등록)로 진입하는 read-only
 * 상세 화면이다. 이 페이지는 조회(useDraftDetailQuery)·라우트 파라미터 검증·로딩/에러 분기만 담당하고,
 * 화면 각 영역은 **영역별 슬롯 컴포넌트(components/detail/*)를 조립만** 한다 — 이후 M3(결재자 액션)·
 * M4(기안자 액션)·M5(공람)·M6(첨부)이 각자 자기 슬롯 파일에서 기능을 얹어 병렬 편집 충돌을 피한다.
 * 슬롯 공통 props 계약은 components/detail/types.ts(DraftDetailSectionProps `{ draft }`) 참조.
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      onClick={handleBack}
    >
      ← 뒤로
    </Button>
  )

  if (isInvalidDraftId) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backButton}
        <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
        <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (detailQuery.isLoading) {
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backButton}
        <p className="text-sm text-muted-foreground">기안서를 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          {backButton}
          <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
          <p className="text-sm text-muted-foreground">기안서를 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="w-full p-4 sm:p-6 lg:p-8">
          {backButton}
          <h1 className="mb-2 text-xl font-semibold tracking-tight">기안서 상세</h1>
          <p className="text-sm text-muted-foreground">이 기안서를 조회할 권한이 없습니다.</p>
        </div>
      )
    }
    // not-found/forbidden이 아닌 실패는 위 useEffect가 토스트로 알렸으므로 화면은 빈 상태로만 표시한다.
    return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {backButton}
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
    <div className="w-full p-4 sm:p-6 lg:p-8">
      {backButton}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <DraftDetailHeader draft={draft} />
            {/* 액션 버튼 슬롯(M2는 빈 슬롯). M4 기안자 액션 → M3 결재자 액션 순으로 노출된다. */}
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <DrafterActions draft={draft} />
              <ApproverActions draft={draft} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 유형별 본문 슬롯(T2.4): GENERAL=content, 그 외 유형=준비 중 폴백 */}
          <DraftTypeBody draft={draft} />
          <ApprovalLineTimeline draft={draft} />
          <CirculationSection draft={draft} />
          <AttachmentSection draft={draft} />
        </CardContent>
      </Card>
    </div>
  )
}
