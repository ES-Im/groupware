import { useEffect, useRef, useState } from 'react'
import { FileClock, FileText, Paperclip, Plus, Save, Send, X } from 'lucide-react'
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
import { BoardFileValidationError, validateBoardFileUpload } from '../lib/fileValidation'
import { boardCreateSchema, type BoardCreateFormValues } from '../model/boardCreateSchema'
import type { BoardUpdateRequest } from '../model/board'
import { BoardEditAttachments } from './BoardEditAttachments'
import { BoardEditForm } from './BoardEditForm'

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). BoardEditAttachments.tsx의 동일 이름 헬퍼와
 * 표기 방식을 그대로 복제한다(공유 유틸 승격은 이번 태스크 범위 밖). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** 임시저장글 드롭다운의 제목 표시 길이 제한(10자, 사용자 요청). CSS truncate(너비 기반)와 별개로
 * 문자 수 기준 말줄임을 강제한다 — 좁은 컨테이너가 아니어도 10자를 넘으면 항상 줄어든다. */
function truncateDraftTitle(title: string): string {
  const maxLength = 10
  return title.length > maxLength ? `${title.slice(0, maxLength)}…` : title
}

interface BoardCreateFormProps {
  /**
   * 등록(임시저장/발행)·인라인 수정 성공 후 실행할 콜백. 소비처마다 후속 동작이 다르므로
   * (전용 작성 페이지=목록으로 이동, 목록 인라인 카드=작성 카드 접기) 위임한다.
   */
  onSuccess: () => void
  /**
   * 카테고리 select 초기값(BoardListPage가 좌측에서 현재 선택 중인 카테고리를 그대로 전달).
   * 미제공(전용 작성 페이지)이면 categories[0]으로 대체한다. 마운트 시 한 번만 적용해 폼에
   * 반영하고(아래 effect), 그 이후 사용자가 직접 바꾼 값을 덮어쓰지 않는다 — "전체" 옵션을 새로
   * 추가하는 것이 아니라 이미 존재하는 옵션 중 하나를 기본 선택으로만 맞추는 것이다.
   */
  defaultCategoryId?: number
}

/**
 * 게시글 작성 폼(F305/F308) — 데이터/검증 로직을 그대로 담은 재사용 컴포넌트.
 *
 * 전용 작성 페이지(BoardCreatePage)와 목록 인라인 카드(BoardListPage)가 동일하게 소비한다.
 * 바깥 Card/CardHeader는 소비처마다 헤더 문구가 달라 각 소비처가 감싸고, 이 컴포넌트는 폼 본문과
 * "임시저장글" 호버 드롭다운만 렌더한다. categoryId는 useZodForm이 입력=출력 동일 타입을 요구해
 * 문자열로 검증하고, 실제 number 변환은 제출 시점에 수행한다.
 *
 * **첨부파일은 클라이언트 스테이징까지만 지원한다**(선택한 파일명·크기를 목록으로 보여주고 사전
 * 검증만 수행) — 실제 서버 업로드는 하지 않는다. `BOARD_REGISTER`가 `201 Empty`라 등록 직후
 * boardId를 알 수 없어(Location 헤더도 없음, http-response.adoc 실측) 그 시점에 파일을 어디에
 * 붙여야 할지 특정할 수 없기 때문이다(ROADMAP §열린항목18 설계 확정). 실제 업로드는 저장 후
 * "임시저장글" 목록에서 인라인 편집으로 들어가 `BoardEditAttachments`(boardId 확정)로 진행한다 —
 * 폼 하단에 그 안내 문구를 둔다.
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
export function BoardCreateForm({ onSuccess, defaultCategoryId }: BoardCreateFormProps) {
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  // 임시저장글 인라인 편집 대상. undefined면 create 모드, 값이 있으면 그 글의 편집 모드로 전환한다.
  const [editingBoardId, setEditingBoardId] = useState<number | undefined>(undefined)

  // 첨부파일 스테이징(사용자 선택 파일명·크기 미리보기). 실제 업로드는 하지 않는다(위 클래스 주석 참조).
  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 카테고리 select 초기값 동기화: 마운트당 한 번만 적용한다(ref 가드) — 이후 사용자가 이 셀렉트를
  // 직접 바꾼 값을 덮어쓰지 않기 위함이다. defaultCategoryId(좌측에서 현재 선택 중인 카테고리)가
  // 없으면(전용 작성 페이지) categories[0]으로 대체한다.
  const appliedDefaultCategoryRef = useRef(false)
  useEffect(() => {
    if (appliedDefaultCategoryRef.current) {
      return
    }
    const initialCategoryId = defaultCategoryId ?? categories[0]?.categoryId
    if (initialCategoryId === undefined) {
      return
    }
    form.setValue('categoryId', String(initialCategoryId))
    appliedDefaultCategoryRef.current = true
  }, [defaultCategoryId, categories, form])

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
    setStagedFiles([]) // 다음 작성을 위해 스테이징 목록도 비운다(실제 업로드는 애초에 하지 않았다).
    // 성공 후 무엇을 할지(이동/접기)는 소비처가 결정하도록 위임한다.
    onSuccess()
  }

  // 첨부파일 스테이징: 실제 업로드 없이 선택 파일만 로컬에 쌓는다. 개수/총량/확장자는
  // validateBoardFileUpload(existingFiles=[] — 서버에 아직 아무것도 없음)로 사전검증해 업로드
  // 가능 시점의 실패를 미리 걸러준다(BoardEditAttachments와 동일 규칙 재사용).
  function handleStagedFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    const combined = [...stagedFiles, ...selected]
    try {
      validateBoardFileUpload(combined, [])
    } catch (error) {
      if (error instanceof BoardFileValidationError) {
        toast.error(error.message)
        return
      }
      throw error
    }
    setStagedFiles(combined)
  }

  function handleRemoveStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index))
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
          // 인라인 편집은 같은 작성 카드 자리를 오가므로 create 모드 폼과 시각적으로 동일하게 맞춘다:
          // 액션 행은 강조(큰 버튼+구분선), 첨부는 카드 래퍼 없이 평평하게.
          emphasizeActions
          getModifiedAt={getModifiedAt}
          isModifiedAtReady={getModifiedAt() !== undefined}
          onSubmitPayload={handleEditSubmit}
        />
        <BoardEditAttachments boardId={editingBoardId} flat />
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

      {/* 첨부파일 스테이징(선택 파일명·용량만 미리보기, 실제 업로드는 저장 후 임시저장글 편집에서
          진행 — 위 클래스 주석 참조). */}
      <div className="flex flex-col gap-1.5">
        <Label>첨부파일</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleStagedFileInputChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus />
          파일 추가
        </Button>
        {stagedFiles.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {stagedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 truncate text-sm text-foreground">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                  {file.name}
                </span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatFileSizeMb(file.size)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveStagedFile(index)}
                    aria-label={`${file.name} 제거`}
                  >
                    <X />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">선택된 첨부파일이 없습니다.</p>
        )}
        <p className="text-xs text-muted-foreground">
          선택한 파일은 게시글을 저장한 뒤 "임시저장글" 목록에서 열어 첨부할 수 있습니다.
        </p>
      </div>

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
            className="px-5 font-semibold"
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
          {/* 드롭다운: 제목 | 작성일시 컬럼(요청은 "카테고리 | 제목 | 작성일시"였으나, BOARD_DRAFTS
              응답에는 categoryId가 없어(model/board.ts BoardDraftSummary = {boardId,title,updatedAt})
              카테고리 열은 추가하지 않는다 — 계약에 없는 값을 발명하지 않는다, response-fields.adoc
              실측. 백엔드가 필드를 추가하면 그때 열을 더한다). 제목은 10자를 넘으면 말줄임
              (truncateDraftTitle), 작성일시는 "YY-MM-DD HH:mm"(2자리 연도) — 12시간제(hh)는 오전/오후
              표기 없이는 시각이 모호해져 24시간제(HH)를 그대로 쓴다. 행 클릭 시 인라인 편집으로 진입한다. */}
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
                        <span className="truncate">{truncateDraftTitle(draft.title)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {dayjs(draft.updatedAt).format('YY-MM-DD HH:mm')}
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
