import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { commentSchema, type CommentFormValues } from '../model/commentSchema'

interface CommentFormProps {
  onSubmit: (values: CommentFormValues) => Promise<void>
  onCancel?: () => void
  initialContent?: string
  submitLabel: string
  placeholder?: string
  autoFocus?: boolean
}

export function CommentForm({
  onSubmit,
  onCancel,
  initialContent,
  submitLabel,
  placeholder = '댓글을 입력해주세요',
  autoFocus,
}: CommentFormProps) {
  const form = useZodForm(commentSchema, {
    defaultValues: { content: initialContent ?? '' },
  })
  const {
    register,
    formState: { errors, isSubmitting },
    reset,
  } = form

  const submit = submitWithErrorMapping(form, async (values) => {
    await onSubmit(values)
    reset({ content: initialContent ?? '' })
  })

  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        <Textarea
          aria-label="댓글 내용"
          placeholder={placeholder}
          maxLength={300}
          aria-invalid={!!errors.content}
          autoFocus={autoFocus}
          className="min-h-16"
          {...register('content')}
        />
        {errors.content && (
          <p role="alert" className="text-sm text-destructive">
            {errors.content.message}
          </p>
        )}
        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="button" size="sm" disabled={isSubmitting} onClick={() => void submit()}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
