import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Loader2, Paperclip, Plus, Save, SquarePen, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import type { CategoryItem } from '@/features/category/model/category'
import { useBoardDetailQuery } from '../api/useBoardDetailQuery'
import { useBoardEditModeQuery } from '../api/useBoardEditModeQuery'
import { useBoardFileDeleteMutation } from '../api/useBoardFileDeleteMutation'
import { useBoardFilesQuery } from '../api/useBoardFilesQuery'
import { useBoardFileUploadMutation } from '../api/useBoardFileUploadMutation'
import { useBoardUpdateMutation } from '../api/useBoardUpdateMutation'
import { BoardFileValidationError } from '../lib/fileValidation'
import { boardEditSchema, type BoardEditFormValues } from '../model/boardEditSchema'
import type { BoardUpdateRequest } from '../model/board'

/**
 * 편집 폼 자체(카테고리/제목/본문 + 저장). editModeQuery.data가 확정된 뒤에만 부모
 * (BoardEditPage)가 이 컴포넌트를 마운트한다 — UpdateMePage/UpdateMeForm과 동일하게 RHF가
 * 마운트 시점의 defaultValues를 그대로 신뢰하도록 해, 데이터 도착 후 수동 reset()을 두지 않는다.
 *
 * `getModifiedAt`은 부모가 매 렌더 시점의 최신 detailQuery 상태로 계산해 내려주는 게터다 —
 * 저장 시점에 호출해 그 순간 확정된 modifiedAt(또는 초안 폴백값)을 읽는다. `isModifiedAtReady`가
 * false인 동안 저장 버튼을 비활성화해, 아직 값이 정해지지 않은 상태로 제출되는 것을 막는다.
 */
function BoardEditForm({
  cancelPath,
  categories,
  defaultValues,
  getModifiedAt,
  isModifiedAtReady,
  onSubmitPayload,
}: {
  cancelPath: string
  categories: CategoryItem[]
  defaultValues: BoardEditFormValues
  getModifiedAt: () => string | undefined
  isModifiedAtReady: boolean
  onSubmitPayload: (payload: BoardUpdateRequest) => Promise<void>
}) {
  const form = useZodForm(boardEditSchema, { defaultValues })
  const {
    register,
    formState: { errors, isSubmitting, dirtyFields },
  } = form

  async function submit(values: BoardEditFormValues) {
    const modifiedAt = getModifiedAt()
    if (modifiedAt === undefined) {
      // 저장 버튼이 이 상태에서는 비활성화돼 있어야 하지만 방어적으로 한번 더 막는다.
      toast.error('저장 준비 중입니다. 잠시 후 다시 시도해주세요')
      return
    }

    // 변경 필드만 전송(PATCH 시맨틱) — dirtyFields로 실제로 값을 바꾼 필드만 payload에 포함한다.
    const payload: BoardUpdateRequest = { modifiedAt }
    if (dirtyFields.categoryId) {
      payload.categoryId = Number(values.categoryId)
    }
    if (dirtyFields.title) {
      payload.title = values.title
    }
    if (dirtyFields.content) {
      payload.content = values.content
    }

    if (payload.categoryId === undefined && payload.title === undefined && payload.content === undefined) {
      toast.error('변경된 내용이 없습니다')
      return
    }

    await onSubmitPayload(payload)
  }

  const submitEdit = submitWithErrorMapping(form, submit)

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="board-edit-category">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <select
          id="board-edit-category"
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
        <Label htmlFor="board-edit-title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="board-edit-title"
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
        <Label htmlFor="board-edit-content">
          본문 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="board-edit-content"
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {/* cancelPath는 부모(BoardEditPage)가 detail 404(=초안) 신호로 계산해 내려준다 —
            발행 글이면 상세로, 초안이면 목록으로 보내 BoardDetailPage의 상시 404를 피한다
            (아래 resolveEditTargetPath 주석 참조, 저장 성공 후 이동과 동일한 분기). */}
        <Button asChild variant="outline">
          <Link to={cancelPath}>취소</Link>
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || !isModifiedAtReady}
          onClick={() => void submitEdit()}
        >
          <Save />
          저장
        </Button>
      </div>
    </form>
  )
}

/** 바이트 크기를 MB 단위 문자열로 변환(소수 1자리). EmployeeInfoView.tsx의 동일 이름 헬퍼와 표기
 * 방식을 그대로 복제한다(공유 유틸 승격은 이번 태스크 범위 밖). */
function formatFileSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * 첨부파일 목록·추가 업로드·개별 삭제 섹션(F304/F309/F312, ROADMAP T13.3-b).
 *
 * useBoardFilesQuery(T11.1)·useBoardFileUploadMutation/useBoardFileDeleteMutation(T13.2)를
 * 그대로 소비한다(재구현 금지). 다중 파일 선택 시 useBoardFileUploadMutation의 mutationFn이
 * 파일별 순차 PATCH를 이미 내부 처리하므로(§열린항목3), 여기서는 선택된 파일 배열 전체를 한 번의
 * mutate 호출로 넘기기만 한다 — mutate를 파일별로 여러 번 호출하는 새 업로드 전략은 만들지 않는다.
 * 업로드 진행 중에는 파일 추가 버튼/입력을 비활성화하고 라벨을 "업로드 중..."으로 바꿔 전체
 * 진행상황만 표시한다(개별 파일 단위 진행률은 mutation이 노출하지 않아 발명하지 않는다).
 *
 * 사전검증(`BoardFileValidationError`, T13.2 `validateBoardFileUpload`) 위반은 mutationFn이
 * 네트워크 호출 전에 동기적으로 던지므로 실제 업로드 요청은 발생하지 않는다(boardFileMutations.
 * invalidate.test.tsx가 이미 검증). 이 컴포넌트는 그 메시지를 그대로 토스트에 노출한다 —
 * `normalizeApiError`는 axios 에러 전용 분기만 인식해 이 도메인 에러를 "알 수 없는 오류"로 뭉개
 * 버리므로 별도로 `instanceof` 분기한다.
 */
function BoardEditAttachments({ boardId }: { boardId: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const filesQuery = useBoardFilesQuery(boardId)
  const uploadMutation = useBoardFileUploadMutation()
  const deleteMutation = useBoardFileDeleteMutation()
  const files = filesQuery.data ?? []

  // 삭제 진행 중인 fileId 집합(code-reviewer 지적 반영, non-minor). 단일 deleteMutation 인스턴스의
  // variables/isPending은 "마지막 mutate 호출" 값만 반영해, A 삭제 중 B를 누르면 A행의 disabled가
  // 풀려 중복 DELETE(→404 토스트)가 나갈 수 있었다 — fileId별로 로컬 state에서 개별 추적한다.
  const [deletingFileIds, setDeletingFileIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!filesQuery.error) {
      return
    }
    toast.error(normalizeApiError(filesQuery.error).message)
  }, [filesQuery.error])

  function reportUploadError(error: unknown) {
    if (error instanceof BoardFileValidationError) {
      toast.error(error.message)
      return
    }
    toast.error(normalizeApiError(error).message)
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    // 같은 파일을 재선택해도 change 이벤트가 다시 발화하도록 즉시 비운다(검증 실패 후 재시도 대비).
    event.target.value = ''
    if (selected.length === 0) {
      return
    }
    uploadMutation.mutate(
      { boardId, files: selected, existingFiles: files },
      {
        onSuccess: () => toast.success('첨부파일을 업로드했습니다'),
        onError: reportUploadError,
      },
    )
  }

  function handleDelete(fileId: number) {
    setDeletingFileIds((prev) => new Set(prev).add(fileId))
    deleteMutation.mutate(
      { boardId, fileId },
      {
        onSuccess: () => toast.success('첨부파일을 삭제했습니다'),
        onError: (error) => toast.error(normalizeApiError(error).message),
        onSettled: () => {
          // 성공/실패 어느 쪽이든 해당 fileId의 진행 상태를 해제한다.
          setDeletingFileIds((prev) => {
            const next = new Set(prev)
            next.delete(fileId)
            return next
          })
        },
      },
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-1.5">
            <Paperclip className="size-4" />
            첨부파일{files.length > 0 && ` ${files.length}개`}
          </CardTitle>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            disabled={uploadMutation.isPending}
            onChange={handleFileInputChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            {uploadMutation.isPending ? '업로드 중...' : '파일 추가'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">첨부파일을 불러오는 중...</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {files.map((file) => {
              const isDeleting = deletingFileIds.has(file.fileId)
              return (
                <li
                  key={file.fileId}
                  className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {file.originalName}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSizeMb(file.fileSize)}
                    </span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      disabled={isDeleting}
                      onClick={() => handleDelete(file.fileId)}
                      aria-label={`${file.originalName} 삭제`}
                    >
                      {/* 파일별 삭제 진행 상태(deletingFileIds)를 개별 스피너로 표시한다 —
                          동시 삭제 시 각 행이 독립적으로 진행 표시되도록 로컬 상태를 그대로 소비한다. */}
                      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 게시글 수정 페이지(F307/F304/F309/F312, ROADMAP T13.3-a/T13.3-b, docs/prd/4.board-slice-prd.md
 * §게시글 수정 페이지).
 *
 * 상세 페이지 "수정" 버튼(T11.3)·작성 페이지 "임시저장글 불러오기"(T12.2)·(향후 M15) 임시저장함
 * "이어쓰기" 세 진입점이 수렴하는 목적지다. 진입점별 특화 로직은 두지 않고, boardId 파라미터만
 * 신뢰해 이 페이지 하나로 동일하게 동작한다(ROADMAP §열린항목18). 두 진입점 모두 실제로
 * `navigate`/`Link`가 `/boards/${boardId}/edit`로 향하는지는 BoardDetailPage.tsx·BoardCreatePage.tsx
 * 에서 이미 확인됨(T13.3-b 진입점 수렴 확인, 별도 특화 로직 신규 발명 없음).
 *
 * 첨부 목록/추가 업로드/개별 삭제(F304/F309/F312, T13.3-b)는 편집 폼 카드 아래
 * `BoardEditAttachments`가 담당한다. 편집 폼과 별도 카드로 분리해 첨부 mutation 실패가 편집 폼
 * 상태(RHF dirtyFields 등)에 영향을 주지 않도록 한다.
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
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">게시글 수정</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <SquarePen className="size-4" />
            게시글 정보
          </CardTitle>
          <CardDescription>카테고리·제목·본문을 수정한 뒤 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* //todo : [minor] cancelPath는 매 렌더 계산되는데 detailQuery는 editMode 성공 후에야 발화한다 — detail 로딩 창에서는 초안이어도 detailQuery.error가 없어 /boards/:boardId(상세)로 계산돼, 그 사이 "취소"를 누른 초안은 여전히 상세 404에 착지한다(저장은 isModifiedAtReady로 게이팅되나 취소 Link는 항상 활성이라 비대칭). detail이 resolve될 때까지 취소도 함께 게이팅/보류하는 방향 검토 */}
          <BoardEditForm
            cancelPath={resolveEditTargetPath()}
            categories={categories}
            defaultValues={{
              categoryId: String(editMode.categoryId),
              title: editMode.title,
              content: editMode.content,
            }}
            getModifiedAt={getModifiedAt}
            isModifiedAtReady={getModifiedAt() !== undefined}
            onSubmitPayload={handleSubmitPayload}
          />
        </CardContent>
      </Card>

      <BoardEditAttachments boardId={boardId} />
    </div>
  )
}
