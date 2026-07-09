import { Link } from 'react-router'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import type { CategoryItem } from '@/features/category/model/category'
import { boardEditSchema, type BoardEditFormValues } from '../model/boardEditSchema'
import type { BoardUpdateRequest } from '../model/board'

/**
 * "취소" 버튼 동작. 전용 수정 페이지(BoardEditPage)는 유효 경로로 되돌아가는 Link(`link`)를,
 * 목록 인라인 편집(BoardCreateForm)은 라우트 이동 없이 create 모드로 되돌리는 콜백(`button`)을
 * 각각 주입한다 — 인라인 컨텍스트에서 Link로 이동해버리면 인라인 편집의 의미가 사라지기 때문이다.
 */
type BoardEditCancel =
  | { type: 'link'; path: string }
  | { type: 'button'; onClick: () => void }

/**
 * 편집 폼 자체(카테고리/제목/본문 + 저장). editModeQuery.data가 확정된 뒤에만 부모
 * (BoardEditPage/BoardCreateForm)가 이 컴포넌트를 마운트한다 — UpdateMePage/UpdateMeForm과
 * 동일하게 RHF가 마운트 시점의 defaultValues를 그대로 신뢰하도록 해, 데이터 도착 후 수동 reset()을
 * 두지 않는다.
 *
 * `getModifiedAt`은 부모가 매 렌더 시점의 최신 detailQuery 상태로 계산해 내려주는 게터다 —
 * 저장 시점에 호출해 그 순간 확정된 modifiedAt(또는 초안 폴백값)을 읽는다. `isModifiedAtReady`가
 * false인 동안 저장 버튼을 비활성화해, 아직 값이 정해지지 않은 상태로 제출되는 것을 막는다.
 */
export function BoardEditForm({
  cancel,
  categories,
  defaultValues,
  getModifiedAt,
  isModifiedAtReady,
  onSubmitPayload,
}: {
  cancel: BoardEditCancel
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
        {/* cancel은 소비처가 컨텍스트에 맞게 주입한다: 전용 수정 페이지는 유효 경로 Link(발행 글이면
            상세, 초안이면 목록), 목록 인라인 편집은 create 모드로 되돌리는 버튼. */}
        {cancel.type === 'link' ? (
          <Button asChild variant="outline">
            <Link to={cancel.path}>취소</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={cancel.onClick}>
            취소
          </Button>
        )}
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
