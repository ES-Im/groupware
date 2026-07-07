import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronDown, ChevronUp } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useCategoriesQuery } from '@/features/category/api/useCategoriesQuery'
import { useBoardDraftsQuery } from '../api/useBoardDraftsQuery'
import { useBoardRegisterMutation } from '../api/useBoardRegisterMutation'
import { boardCreateSchema, type BoardCreateFormValues } from '../model/boardCreateSchema'

/**
 * 게시글 작성 페이지(F305/F308, ROADMAP T12.2, docs/prd/4.board-slice-prd.md §게시글 작성 페이지).
 *
 * 카테고리(T10.2 `useCategoriesQuery` 재사용)·제목·본문만 다루는 텍스트 전용 작성 폼이다.
 * 첨부는 이 페이지 범위 밖이다(`BOARD_REGISTER`가 `201 Empty`로 boardId를 반환하지 않아 등록
 * 직후 업로드 대상을 특정할 수 없다 — ROADMAP §열린항목18 설계 확정). categoryId는
 * AppointDepartmentLeaderDialog(T9.2)의 leaderEmpId와 동일한 이유로 문자열로 검증하고
 * (useZodForm이 입력=출력 동일 타입을 요구), 실제 number 변환은 제출 시점에 수행한다.
 *
 * "임시저장"/"발행" 두 버튼은 동일한 클라 사전검증(zodResolver)을 통과한 뒤 `publishedAt`
 * 포함 여부로만 분기한다(발행=현재시각을 `BOARD_REGISTER` 계약 예시와 동일한 zone 없는
 * `LocalDateTime` 포맷("YYYY-MM-DDTHH:mm:ss")으로 포함, 임시저장=미포함). 두 버튼 모두
 * type="button"으로 두고 `form.handleSubmit`이 반환하는 콜백을 직접 호출한다 — 네이티브
 * `<form>` 제출 이벤트 하나로는 클릭한 버튼(임시저장/발행)을 구분할 안전한 방법이 없어서다.
 * `registerBoard`가 boardId를 반환하지 않으므로 두 경우 모두 성공 후 상세로 이동하지 않고
 * 게시판 목록(`/boards`)으로 이동한다(ROADMAP T12.2 확정 동작).
 *
 * "임시저장글 불러오기" 토글(F308 재사용, `useBoardDraftsQuery`)은 첨부가 필요한 글을 이어
 * 쓰기 위한 경로다. **사용자가 목록에서 boardId를 직접 클릭 선택해야만** 이동이 발생하며,
 * "가장 최근" 등 자동 추정/휴리스틱은 절대 사용하지 않는다(다건 임시저장 시 오배치 방지,
 * ROADMAP §열린항목18/설계 확정 — 재논의 대상 아님). 선택 시 `/boards/:boardId/edit`(게시글
 * 수정 페이지, M13에서 실제 구현)로 이동한다.
 */
export function BoardCreatePage() {
  const navigate = useNavigate()
  const categoriesQuery = useCategoriesQuery()
  const categories = categoriesQuery.data ?? []

  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const draftsQuery = useBoardDraftsQuery()
  const drafts = draftsQuery.data ?? []

  const registerMutation = useBoardRegisterMutation()

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

  // 토글을 펼쳤을 때만 조회 실패를 알린다 — 펼치기 전에는 아직 사용자가 이 기능을 쓰지 않은
  // 상태라 조용히 두는 것이 맞다(BoardListPage의 카테고리/목록 실패 토스트 컨벤션과 동일하게
  // "필요한 순간에만" 알린다).
  useEffect(() => {
    if (!isDraftsOpen || !draftsQuery.error) {
      return
    }
    toast.error(normalizeApiError(draftsQuery.error).message)
  }, [isDraftsOpen, draftsQuery.error])

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
    navigate('/boards')
  }

  const submitDraft = submitWithErrorMapping(form, (values) => submit(values, { publish: false }))
  const submitPublish = submitWithErrorMapping(form, (values) => submit(values, { publish: true }))

  // "임시저장글 불러오기": 사용자의 명시적 클릭으로만 이동한다(자동 추정 금지 — 위 클래스 주석 참조).
  function handleSelectDraft(boardId: number) {
    navigate(`/boards/${boardId}/edit`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">게시글 작성</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>새 게시글</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void submitDraft()}
              >
                임시저장
              </Button>
              <Button type="button" disabled={isSubmitting} onClick={() => void submitPublish()}>
                발행
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent>
          <button
            type="button"
            onClick={() => setIsDraftsOpen((prev) => !prev)}
            aria-expanded={isDraftsOpen}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            <span>임시저장글 불러오기</span>
            {isDraftsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {isDraftsOpen && (
            <div className="mt-3 flex flex-col gap-1 border-t pt-3">
              <p className="mb-1 text-xs text-muted-foreground">
                첨부가 필요한 글은 아래에서 직접 선택해 수정 페이지로 이어갑니다.
              </p>
              {draftsQuery.isLoading ? (
                <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
              ) : drafts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  임시저장한 글이 없습니다.
                </p>
              ) : (
                drafts.map((draft) => (
                  <button
                    key={draft.boardId}
                    type="button"
                    onClick={() => handleSelectDraft(draft.boardId)}
                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                  >
                    <span className="truncate">{draft.title}</span>
                    <span className="ml-3 shrink-0 text-xs text-muted-foreground">
                      {dayjs(draft.updatedAt).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
