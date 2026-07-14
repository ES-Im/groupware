import { useId } from 'react'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { categoryNameSchema, type CategoryNameFormValues } from '../model/categorySchema'

interface CategoryNameFormProps {
  /** 등록/이름변경 공용 제출 콜백. 실패 시 던진 에러는 submitWithErrorMapping이 처리한다. */
  onSubmit: (values: CategoryNameFormValues) => Promise<void>
  /** 취소(이름변경 인라인 폼 닫기) 콜백. 등록 폼에는 취소 버튼이 없어 생략 가능. */
  onCancel?: () => void
  /** 이름변경 폼의 초기값(기존 카테고리명). 생략하면 빈 값으로 시작한다(등록). */
  initialName?: string
  submitLabel: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

/**
 * 카테고리 등록/이름변경 공용 폼(`CATEGORY_REGISTER`/`CATEGORY_UPDATE_NAME`, ADMIN 전용).
 *
 * CommentForm(board 도메인)과 동일한 이유로 두 용도를 하나의 컴포넌트로 공유한다 — 요청 바디가
 * categoryName 단일 필드로 완전히 동일하다(model/categorySchema.ts 주석 참조). 구분은 호출부가
 * 넘기는 onSubmit/initialName/submitLabel로만 한다. T1.1 표준(useZodForm+submitWithErrorMapping)을
 * 그대로 복제한다. categoryName은 단일 라인 입력(Input)이라 Enter로 자연스럽게 제출된다
 * (Textarea를 쓰는 CommentForm과 달리 수동 클릭 우회가 필요 없다).
 */
export function CategoryNameForm({
  onSubmit,
  onCancel,
  initialName,
  submitLabel,
  placeholder = '카테고리명을 입력해주세요',
  autoFocus,
  className,
}: CategoryNameFormProps) {
  const inputId = useId()
  const form = useZodForm(categoryNameSchema, {
    defaultValues: { categoryName: initialName ?? '' },
  })
  const {
    register,
    formState: { errors, isSubmitting },
    reset,
  } = form

  const submit = submitWithErrorMapping(form, async (values) => {
    await onSubmit(values)
    reset({ categoryName: initialName ?? '' })
  })

  return (
    <form noValidate onSubmit={submit} className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <Label htmlFor={inputId} className="sr-only">
            카테고리명
          </Label>
          <Input
            id={inputId}
            maxLength={30}
            placeholder={placeholder}
            aria-invalid={!!errors.categoryName}
            autoFocus={autoFocus}
            {...register('categoryName')}
          />
        </div>
        {onCancel && (
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
      {errors.categoryName && (
        <p role="alert" className="text-sm text-destructive">
          {errors.categoryName.message}
        </p>
      )}
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
    </form>
  )
}
