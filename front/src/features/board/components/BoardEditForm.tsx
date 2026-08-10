import type {ReactNode} from 'react'
import {Link} from 'react-router'
import {Save, Send} from 'lucide-react'
import {toast} from 'sonner'
import {submitWithErrorMapping, useZodForm} from '@/shared/lib/form'
import {Button} from '@/shared/ui/button'
import {Input} from '@/shared/ui/input'
import {Label} from '@/shared/ui/label'
import {Textarea} from '@/shared/ui/textarea'
import type {CategoryItem} from '@/features/category/model/category'
import {type BoardEditFormValues, boardEditSchema} from '../model/boardEditSchema'
import type {BoardUpdateRequest} from '../model/board'

type BoardEditCancel =
  | { type: 'link'; path: string }
  | { type: 'button'; onClick: () => void }

export function BoardEditForm({
  cancel,
  categories,
  defaultValues,
  attachmentsSlot,
  getModifiedAt,
  isModifiedAtReady,
  onSubmitPayload,
  publish,
}: {
  cancel: BoardEditCancel
  categories: CategoryItem[]
  defaultValues: BoardEditFormValues
  attachmentsSlot?: ReactNode
  getModifiedAt: () => string | undefined
  isModifiedAtReady: boolean
  onSubmitPayload: (payload: BoardUpdateRequest) => Promise<void>
  publish?: { onClick: () => void; isPending: boolean }
}) {
  const form = useZodForm(boardEditSchema, { defaultValues })
  const {
    register,
    formState: { errors, isSubmitting, dirtyFields },
  } = form

  async function submit(values: BoardEditFormValues) {
    const modifiedAt = getModifiedAt()
    if (modifiedAt === undefined) {
      toast.error('저장 준비 중입니다. 잠시 후 다시 시도해주세요')
      return
    }

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
    <form
      noValidate
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-1 flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="board-edit-category" className="shrink-0">
          카테고리 <span className="text-destructive">*</span>
        </Label>
        <select
          id="board-edit-category"
          aria-invalid={!!errors.categoryId}
          disabled={categories.length === 0}
          className="h-8 w-56 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
          {...register('categoryId')}
        >
          <option value="">카테고리 선택</option>
          {categories.map((category) => (
            <option key={category.categoryId} value={category.categoryId}>
              {category.categoryName}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p role="alert" className="w-full text-sm text-destructive">
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

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <Label htmlFor="board-edit-content">
          본문 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="board-edit-content"
          placeholder="본문을 입력해주세요"
          className="min-h-48 flex-1 resize-y"
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

      {attachmentsSlot}

      <div className="mt-2 flex flex-col-reverse gap-3 rounded-xl border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-end">
        {cancel.type === 'link' ? (
          <Button asChild variant="outline">
            <Link to={cancel.path}>취소</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={cancel.onClick}>
            취소
          </Button>
        )}
        {publish && (
          <Button
            type="button"
            variant="secondary"
            disabled={publish.isPending}
            onClick={publish.onClick}
          >
            <Send />
            발행
          </Button>
        )}
        <Button
          type="button"
          className="font-semibold"
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
