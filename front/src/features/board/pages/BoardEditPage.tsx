import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { SquarePen } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { useBoardDetailQuery } from '../api/useBoardDetailQuery'
import { useBoardEditModeQuery } from '../api/useBoardEditModeQuery'
import { useBoardUpdateMutation } from '../api/useBoardUpdateMutation'
import { BoardEditAttachments } from '../components/BoardEditAttachments'
import { BoardEditForm } from '../components/BoardEditForm'
import type { BoardUpdateRequest } from '../model/board'

/**
 * 게시글 수정 페이지(F307/F304/F309/F312, ROADMAP T13.3-a/T13.3-b, docs/prd/4.board-slice-prd.md
 * §게시글 수정 페이지).
 *
 * 편집 폼 자체(카테고리/제목/본문 + 저장)와 첨부 섹션은 순수 props 기반 컴포넌트
 * `BoardEditForm`/`BoardEditAttachments`로 분리해, 이 페이지와 목록 인라인 편집(BoardCreateForm)이
 * 동일하게 재사용한다. 편집 폼과 첨부를 별도 카드로 분리해 첨부 mutation 실패가 편집 폼 상태
 * (RHF dirtyFields 등)에 영향을 주지 않도록 한다.
 *
 * 상세 페이지 "수정" 버튼(T11.3)·작성 페이지 "임시저장글 불러오기"(T12.2)·(향후 M15) 임시저장함
 * "이어쓰기" 세 진입점이 수렴하는 목적지다. 진입점별 특화 로직은 두지 않고, boardId 파라미터만
 * 신뢰해 이 페이지 하나로 동일하게 동작한다(ROADMAP §열린항목18).
 *
 * useBoardEditModeQuery(T13.1, `BOARD_EDIT_MODE`)로 카테고리/제목/본문 초기값을 로드한다.
 * 편집 초기값 응답에는 modifiedAt 필드가 없다(response-fields.adoc 실측 — getBoardEditMode.ts
 * 주석 참조). 반면 `BOARD_UPDATE` 요청은 modifiedAt이 `@NotNull`(BoardUpdateRequest.java) 필수다.
 *
 * **modifiedAt 소스 확정(신규 발견, 백엔드 소스 실측)**: `Board.changeBoard`(domain/board/Board.java)
 * 는 `isDraft=true`인 글에는 전달받은 modifiedAt을 검증/저장 없이 완전히 무시하고, `isDraft=false`
 * (발행 글)에만 "수정시각이 발행시각보다 이를 수 없음"을 검증해 실제로 반영한다. 즉:
 * - 발행 글: `BOARD_DETAIL`(T11.1, `useBoardDetailQuery`) 응답의 modifiedAt을 그대로 되돌려 보낸다.
 * - 초안(draft) 글: 서버가 값을 무시하므로 아무 유효한 LocalDateTime 문자열이면 되지만, `BOARD_DETAIL`
 *   은 초안에는 항상 404를 반환한다(`findBoardByIdAndIsDraftFalse`, BoardDetailPage.tsx 주석 참조)
 *   — 즉 초안 여부를 알려주는 다른 조회 경로가 계약상 없다. 이 404 자체를 "초안이다"의 신호로
 *   재사용해, 그 경우에만 현재 시각(BoardCreatePage의 publishedAt과 동일한 zone 없는 포맷)을
 *   폴백으로 보낸다. editMode가 성공한 뒤에만 detail을 조회해(아래 enabled 가드) 소유권 위반
 *   (403)·not-found 경로에서 불필요한 viewCount 증가(useBoardDetailQuery 주석 참조)를 피한다.
 */
export function BoardEditPage() {
  const { boardId: boardIdParam } = useParams()
  const navigate = useNavigate()

  // route param은 신뢰 불가 입력이다(BoardDetailPage/DepartmentDetailPage와 동일 가드): 순수 10진
  // 양의 정수 형식만 허용해 지수/16진수/음수 표기가 다른 게시글로 오매핑되는 것을 막는다.
  const isDecimalPositiveInteger = boardIdParam !== undefined && /^[1-9][0-9]*$/.test(boardIdParam)
  const boardId = isDecimalPositiveInteger ? Number(boardIdParam) : undefined
  const isInvalidBoardId = boardId === undefined

  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const editModeQuery = useBoardEditModeQuery(isInvalidBoardId ? undefined : boardId)
  const detailQuery = useBoardDetailQuery(
    isInvalidBoardId || !editModeQuery.isSuccess ? undefined : boardId,
  )
  const updateMutation = useBoardUpdateMutation()

  useEffect(() => {
    if (!categoriesQuery.error) {
      return
    }
    toast.error(normalizeApiError(categoriesQuery.error).message)
  }, [categoriesQuery.error])

  // not-found/forbidden은 아래에서 전용 UX로 렌더하므로, 그 외 실패만 토스트로 알린다
  // (BoardDetailPage/EmployeeDetailPage와 동일 컨벤션).
  useEffect(() => {
    if (!editModeQuery.error) {
      return
    }
    const apiError = normalizeApiError(editModeQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [editModeQuery.error])

  // detail의 404는 "초안이다"의 정상 신호로 소비하므로(위 클래스 주석 참조) 조용히 둔다.
  // 그 외 실패만 알린다 — 이 경우 저장 버튼이 계속 비활성화 상태로 남는 이유를 사용자에게 알려준다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  function getModifiedAt(): string | undefined {
    if (detailQuery.data) {
      return detailQuery.data.modifiedAt
    }
    if (detailQuery.error && isNotFound(normalizeApiError(detailQuery.error))) {
      return dayjs().format('YYYY-MM-DDTHH:mm:ss')
    }
    return undefined
  }

  /**
   * 초안(draft)/발행 글에 따라 되돌아갈 유효 경로를 분기한다(사용자 결정 반영, code-reviewer
   * 지적 해소). `BOARD_UPDATE`는 `isDraft`를 바꾸지 않으므로 초안을 수정해도 여전히 초안이고,
   * `BoardDetailPage`(`BOARD_DETAIL`)는 초안에 항상 404를 반환한다 — 상세로 보내면 저장 성공/취소
   * 직후 404 화면에 착지한다. detail의 404를 그대로 "초안이다" 신호로 재사용해 초안이면 게시판
   * 목록(`/boards`)으로, 발행 글이면 상세(`/boards/:boardId`)로 보낸다. M15(내 임시저장함,
   * `/boards/drafts`)가 아직 없어 초안의 이상적인 목적지는 아니지만, BoardCreatePage가 등록 후
   * `/boards`로 보내는 것과 일관된 임시 목적지다(M15에서 재검토).
   */
  function resolveEditTargetPath(): string {
    if (detailQuery.error && isNotFound(normalizeApiError(detailQuery.error))) {
      return '/boards'
    }
    return `/boards/${boardId}`
  }

  async function handleSubmitPayload(payload: BoardUpdateRequest) {
    if (boardId === undefined) {
      return
    }
    await updateMutation.mutateAsync({ boardId, payload })
    toast.success('게시글을 수정했습니다')
    navigate(resolveEditTargetPath())
  }

  if (isInvalidBoardId) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
      </div>
    )
  }

  if (editModeQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  if (editModeQuery.error) {
    const apiError = normalizeApiError(editModeQuery.error)
    if (isNotFound(apiError)) {
      return (
        <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
          <p className="text-sm text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        </div>
      )
    }
    if (isForbidden(apiError)) {
      return (
        <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
          <p className="text-sm text-muted-foreground">이 게시글을 수정할 권한이 없습니다.</p>
        </div>
      )
    }
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="text-sm text-muted-foreground">게시글을 불러오지 못했습니다.</p>
      </div>
    )
  }

  // 로딩·에러 분기를 모두 통과한 렌더 직전 최종 가드. data! non-null 단언 없이 좁힌다.
  if (!editModeQuery.data || boardId === undefined) {
    return null
  }

  // categoriesQuery도 함께 게이팅한다(UpdateMePage/UpdateMeForm의 "데이터 준비 후에만 폼 마운트"
  // 패턴과 동일, code-reviewer 지적 해소). BoardEditForm의 카테고리 <select>는 uncontrolled
  // (register만, value 미주입)이라 categories가 editMode보다 늦게 도착하면(둘 다 마운트 시 동시
  // 발화라 순서 미보장) 마운트 시점엔 매칭 option이 없어 값이 재적용되지 않는다 — 성공/실패 어느
  // 쪽이든 categoriesQuery.isLoading이 꺼진 뒤에만 폼을 마운트해 이 레이스를 없앤다(실패 시에는
  // categories=[]로 폴백해 BoardCreatePage와 동일하게 select가 비활성화되고 토스트로 알린다).
  if (categoriesQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    )
  }

  const editMode = editModeQuery.data

  return (
    // 게시글 작성 폼과 동일한 풀높이 레이아웃(사용자 요청): 페이지가 main 높이를 채우고, 카드가
    // 그리드 셀 전체 높이를 차지해 본문 Textarea가 남는 높이를 흡수하고 액션바가 카드 최하단에 붙는다.
    <div className="flex w-full flex-col p-4 sm:p-6 lg:h-full lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">게시글 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">카테고리·제목·본문을 수정한 뒤 저장합니다.</p>
      </div>

      {/* 작성 폼과 동일하게 폼(카테고리·제목·본문)+첨부+액션바를 하나의 풀높이 카드에 담는다.
          BoardEditForm이 첨부를 attachmentsSlot으로 받아 본문과 액션바 사이에 렌더한다. */}
      <Card className="flex flex-col lg:min-h-0 lg:flex-1">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            게시글 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col">
          {/* //todo : [minor] cancel(link)는 매 렌더 계산되는데 detailQuery는 editMode 성공 후에야 발화한다 — detail 로딩 창에서는 초안이어도 detailQuery.error가 없어 /boards/:boardId(상세)로 계산돼, 그 사이 "취소"를 누른 초안은 여전히 상세 404에 착지한다(저장은 isModifiedAtReady로 게이팅되나 취소 Link는 항상 활성이라 비대칭). detail이 resolve될 때까지 취소도 함께 게이팅/보류하는 방향 검토 */}
          <BoardEditForm
            cancel={{ type: 'link', path: resolveEditTargetPath() }}
            categories={categories}
            defaultValues={{
              categoryId: String(editMode.categoryId),
              title: editMode.title,
              content: editMode.content,
            }}
            attachmentsSlot={<BoardEditAttachments boardId={boardId} flat />}
            getModifiedAt={getModifiedAt}
            isModifiedAtReady={getModifiedAt() !== undefined}
            onSubmitPayload={handleSubmitPayload}
          />
        </CardContent>
      </Card>
    </div>
  )
}
