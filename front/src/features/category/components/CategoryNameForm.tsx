import { useId } from 'react'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { categoryNameSchema, type CategoryNameFormValues } from '../model/categorySchema'

interface CategoryNameFormProps {
  onSubmit: (values: CategoryNameFormValues) => Promise<void>
  onCancel?: () => void
  initialName?: string
  submitLabel: string
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

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
