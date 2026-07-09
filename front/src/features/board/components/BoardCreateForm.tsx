import { useEffect, useState } from 'react'
import { FileClock, FileText, Save, Send } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/ui/hover-card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { useBoardDetailQuery } from '../api/useBoardDetailQuery'
import { useBoardDraftsQuery } from '../api/useBoardDraftsQuery'
import { useBoardEditModeQuery } from '../api/useBoardEditModeQuery'
import { useBoardRegisterMutation } from '../api/useBoardRegisterMutation'
import { useBoardUpdateMutation } from '../api/useBoardUpdateMutation'
import { boardCreateSchema, type BoardCreateFormValues } from '../model/boardCreateSchema'
import type { BoardUpdateRequest } from '../model/board'
import { BoardEditAttachments } from './BoardEditAttachments'
import { BoardEditForm } from './BoardEditForm'

interface BoardCreateFormProps {
  /**
   * 등록(임시저장/발행)·인라인 수정 성공 후 실행할 콜백. 소비처마다 후속 동작이 다르므로
   * (전용 작성 페이지=목록으로 이동, 목록 인라인 카드=작성 카드 접기) 위임한다.
   */
  onSuccess: () => void
}

/**
 * 게시글 작성 폼(F305/F308) — 데이터/검증 로직을 그대로 담은 재사용 컴포넌트.
 *
 * 전용 작성 페이지(BoardCreatePage)와 목록 인라인 카드(BoardListPage)가 동일하게 소비한다.
 * 바깥 Card/CardHeader는 소비처마다 헤더 문구가 달라 각 소비처가 감싸고, 이 컴포넌트는 폼 본문과
 * "임시저장글" 호버 드롭다운만 렌더한다. 카테고리·제목·본문만 다루는 텍스트 전용 작성 폼이다
 * (첨부는 이 폼 범위 밖 — BOARD_REGISTER가 201 Empty로 boardId를 반환하지 않아 등록 직후 업로드
 * 대상을 특정할 수 없다, ROADMAP §열린항목18 설계 확정). categoryId는 useZodForm이 입력=출력 동일
 * 타입을 요구해 문자열로 검증하고, 실제 number 변환은 제출 시점에 수행한다.
 *
 * "임시저장"/"발행" 두 버튼은 동일한 클라 사전검증(zodResolver)을 통과한 뒤 publishedAt 포함 여부로만
 * 분기한다(발행=현재시각을 BOARD_REGISTER 계약 예시와 동일한 zone 없는 LocalDateTime
 * 포맷("YYYY-MM-DDTHH:mm:ss")으로 포함, 임시저장=미포함). 두 버튼 모두 type="button"으로 두고
 * form.handleSubmit이 반환하는 콜백을 직접 호출한다 — 네이티브 form 제출 이벤트 하나로는 클릭한
 * 버튼(임시저장/발행)을 구분할 안전한 방법이 없어서다.
 *
 * **임시저장글 인라인 편집(F308 재사용)**: 우측 "임시저장글" 버튼에 마우스를 올리면 HoverCard로
 * 임시저장 목록(useBoardDraftsQuery)이 뜨고, 항목을 선택하면 라우트 이동 없이 이 카드 자리에서
 * 바로 편집(editingBoardId)으로 전환한다 — 편집 폼/첨부는 게시글 수정 페이지와 동일한
 * `BoardEditForm`/`BoardEditAttachments`를 그대로 재사용한다. 편집 저장이 끝나면 create 모드로
 * 되돌아가고 onSuccess로 후속 동작(카드 접기 등)을 소비처에 위임한다. "가장 최근" 등 자동 추정은
 * 하지 않고 항상 사용자가 명시적으로 항목을 선택해야만 편집이 시작된다(다건 임시저장 오배치 방지,
 * ROADMAP §열린항목18/설계 확정).
 */
export function BoardCreateForm({ onSuccess }: BoardCreateFormProps) {
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  // 임시저장글 인라인 편집 대상. undefined면 create 모드, 값이 있으면 그 글의 편집 모드로 전환한다.
  const [editingBoardId, setEditingBoardId] = useState<number | undefined>(undefined)

  // HoverCard 열림 여부. 드롭다운을 실제로 펼쳤을 때만 임시저장 조회 실패를 토스트로 알리기 위함이다.
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const draftsQuery = useBoardDraftsQuery()
  const drafts = draftsQuery.data ?? []

  const registerMutation = useBoardRegisterMutation()

  // 인라인 편집 조회/뮤테이션 — editingBoardId가 없으면 enabled:false로 대기한다(BoardEditPage와
  // 동일 패턴). detail은 editMode 성공 뒤에만 조회해 초안의 404 신호를 modifiedAt 폴백에 사용한다.
  const editModeQuery = useBoardEditModeQuery(editingBoardId)
  const detailQuery = useBoardDetailQuery(editModeQuery.isSuccess ? editingBoardId : undefined)
  const updateMutation = useBoardUpdateMutation()

  const form = useZodForm(boardCreateSchema, {
    defaultValues: { categoryId: '', title: '', content: '' },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!categoriesQuery.error) {
      return
    }
    toast.error(normalizeApiError(categoriesQuery.error).message)
  }, [categoriesQuery.error])

  // 드롭다운을 펼쳤을 때만 조회 실패를 알린다 — 펼치기 전에는 아직 사용자가 이 기능을 쓰지 않은
  // 상태라 조용히 두는 것이 맞다(BoardListPage의 카테고리/목록 실패 토스트 컨벤션과 동일하게
  // "필요한 순간에만" 알린다).
  useEffect(() => {
    if (!isDraftsOpen || !draftsQuery.error) {
      return
    }
    toast.error(normalizeApiError(draftsQuery.error).message)
  }, [isDraftsOpen, draftsQuery.error])

  // not-found/forbidden은 인라인 편집 분기에서 전용 UX로 처리하므로 그 외 실패만 토스트로 알린다
  // (BoardEditPage와 동일 컨벤션).
  useEffect(() => {
    if (!editModeQuery.error) {
      return
    }
    const apiError = normalizeApiError(editModeQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [editModeQuery.error])

  // detail의 404는 "초안이다"의 정상 신호(modifiedAt 폴백 근거)이므로 조용히 둔다. 그 외 실패만 알린다.
  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  // modifiedAt 소스 계산(BoardEditPage.getModifiedAt와 동일): 발행 글은 detail 응답의 modifiedAt,
  // 초안은 detail 404를 신호로 현재 시각을 폴백으로 되돌려 보낸다(서버가 초안의 modifiedAt은 무시).
  function getModifiedAt(): string | undefined {
    if (detailQuery.data) {
      return detailQuery.data.modifiedAt
    }
    if (detailQuery.error && isNotFound(normalizeApiError(detailQuery.error))) {
      return dayjs().format('YYYY-MM-DDTHH:mm:ss')
    }
    return undefined
  }

  async function submit(values: BoardCreateFormValues, options: { publish: boolean }) {
    await registerMutation.mutateAsync({
      categoryId: Number(values.categoryId),
      title: values.title,
      content: values.content,
      // 계약 예시(BOARD_REGISTER/request-body.adoc)가 "2026-03-01T10:00:00" 형태의 zone 없는
      // LocalDateTime이라 dayjs로 동일 포맷을 만든다(new Date().toISOString()의 "…Z"·밀리초
      // 포함 형식은 Jackson LocalDateTime 파싱과 맞지 않아 발행 시 400이 날 수 있었다 — 리뷰 지적 반영).
      publishedAt: options.publish ? dayjs().format('YYYY-MM-DDTHH:mm:ss') : undefined,
    })
    toast.success(options.publish ? '게시글을 발행했습니다' : '게시글을 임시저장했습니다')
    // 성공 후 무엇을 할지(이동/접기)는 소비처가 결정하도록 위임한다.
    onSuccess()
  }

  const submitDraft = submitWithErrorMapping(form, (values) => submit(values, { publish: false }))
  const submitPublish = submitWithErrorMapping(form, (values) => submit(values, { publish: true }))

  // 임시저장글 선택: 사용자의 명시적 클릭으로만 인라인 편집으로 전환한다(자동 추정 금지 — 위 주석 참조).
  function handleSelectDraft(boardId: number) {
    setEditingBoardId(boardId)
  }

  // 인라인 편집 저장: 성공 시 create 모드로 되돌아가고 후속 동작(카드 접기 등)은 onSuccess에 위임한다.
  async function handleEditSubmit(payload: BoardUpdateRequest) {
    if (editingBoardId === undefined) {
      return
    }
    await updateMutation.mutateAsync({ boardId: editingBoardId, payload })
    toast.success('게시글을 수정했습니다')
    setEditingBoardId(undefined)
    onSuccess()
  }

  // ===== 임시저장글 인라인 편집 모드 =====
  if (editingBoardId !== undefined) {
    // 편집 초기값·카테고리 로딩 중(카테고리는 <select> uncontrolled 레이스 방지를 위해 함께 게이팅).
    if (editModeQuery.isLoading || categoriesQuery.isLoading) {
      return <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
    }
    // 편집 초기값 조회 실패: 안내 + create 모드 복귀(구체 실패 사유는 위 useEffect가 토스트로 알림).
    if (editModeQuery.error || !editModeQuery.data) {
      return (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">임시저장글을 불러오지 못했습니다.</p>
          <Button type="button" variant="outline" onClick={() => setEditingBoardId(undefined)}>
            돌아가기
          </Button>
        </div>
      )
    }

    const editMode = editModeQuery.data
    return (
      <div className="flex flex-col gap-4">
        {/* 편집 폼/첨부는 게시글 수정 페이지와 동일한 컴포넌트를 재사용한다. key로 다른 임시저장글
            선택 시 RHF가 새 defaultValues로 재초기화되도록 강제 리마운트한다. */}
        <BoardEditForm
          key={editingBoardId}
          cancel={{ type: 'button', onClick: () => setEditingBoardId(undefined) }}
          categories={categories}
          defaultValues={{
            categoryId: String(editMode.categoryId),
            title: editMode.title,
            content: editMode.content,
          }}
          getModifiedAt={getModifiedAt}
          isModifiedAtReady={getModifiedAt() !== undefined}
          onSubmitPayload={handleEditSubmit}
        />
        <BoardEditAttachments boardId={editingBoardId} />
      </div>
    )
  }

  // ===== create 모드 =====
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-category">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <select
          id="board-category"
          aria-invalid={!!errors.categoryId}
          disabled={categories.length === 0}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('categoryId')}
        >
          <option value="">카테고리를 선택해주세요</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p role="alert" className="text-sm text-destructive">
            {errors.categoryId.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="board-title"
          placeholder="제목을 입력해주세요"
          maxLength={50}
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && (
          <p role="alert" className="text-sm text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-content">
          본문 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="board-content"
          placeholder="본문을 입력해주세요"
          className="min-h-48"
          aria-invalid={!!errors.content}
          {...register('content')}
        />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      {/* 액션 행: 좌측 임시저장·발행 그룹 + 우측 "임시저장글" 호버 드롭다운. 세 버튼 모두 size="lg"
          + 넓은 좌우 여백으로 존재감을 키운다(발행=primary 강조, 임시저장=outline, 임시저장글=
          secondary로 발행과 색으로 구분). */}
      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="px-5"
            disabled={isSubmitting}
            onClick={() => void submitDraft()}
          >
            <Save />
            임시저장
          </Button>
          <Button
            type="button"
            size="lg"
            className="px-5"
            disabled={isSubmitting}
            onClick={() => void submitPublish()}
          >
            <Send />
            발행
          </Button>
        </div>

        <HoverCard openDelay={100} closeDelay={150} onOpenChange={setIsDraftsOpen}>
          <HoverCardTrigger asChild>
            <Button type="button" variant="secondary" size="lg" className="px-5">
              <FileClock />
              임시저장글
            </Button>
          </HoverCardTrigger>
          {/* 드롭다운(스크린샷 참고): 제목 | 작성일시 컬럼. BOARD_DRAFTS 응답에는 categoryId가 없어
              (model/board.ts BoardDraftSummary = {boardId,title,updatedAt}) 카테고리 배지는 표기하지
              않는다(계약에 없는 값 발명 금지). 행 클릭 시 인라인 편집으로 진입한다. */}
          <HoverCardContent align="end" className="w-80 overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
              <span>제목</span>
              <span>작성일시</span>
            </div>
            {draftsQuery.isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">불러오는 중...</p>
            ) : drafts.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                임시저장한 글이 없습니다.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto py-1">
                {drafts.map((draft) => (
                  <li key={draft.boardId}>
                    <button
                      type="button"
                      onClick={() => handleSelectDraft(draft.boardId)}
                      className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{draft.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {dayjs(draft.updatedAt).format('YYYY-MM-DD HH:mm')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </HoverCardContent>
        </HoverCard>
      </div>
    </form>
  )
}
