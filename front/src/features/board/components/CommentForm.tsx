import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import { Textarea } from '@/shared/ui/textarea'
import { commentSchema, type CommentFormValues } from '../model/commentSchema'

interface CommentFormProps {
  /** 등록/대댓글/수정 공용 제출 콜백. 실패 시 던진 에러는 submitWithErrorMapping이 처리한다. */
  onSubmit: (values: CommentFormValues) => Promise<void>
  /** 취소(대댓글/수정 인라인 폼 닫기) 콜백. 최상위 등록 폼에는 취소 버튼이 없어 생략 가능. */
  onCancel?: () => void
  /** 수정 폼의 초기값(기존 댓글 내용). 생략하면 빈 값으로 시작한다(등록/대댓글). */
  initialContent?: string
  submitLabel: string
  placeholder?: string
  autoFocus?: boolean
}

/**
 * 댓글 등록/대댓글/수정 공용 폼(ROADMAP T14.2, F314/F315/F316).
 *
 * 세 용도(최상위 등록·대댓글·수정) 모두 요청 바디가 content 단일 필드로 완전히 동일해
 * (T14.1 CommentPayload 주석 참조) 폼 컴포넌트를 하나로 공유한다 — 구분은 호출부가 넘기는
 * onSubmit/initialContent/submitLabel로만 한다. T1.1 표준(useZodForm+submitWithErrorMapping)을
 * 그대로 복제한다.
 */
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
