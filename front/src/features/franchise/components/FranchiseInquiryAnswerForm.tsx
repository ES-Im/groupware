import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useFranchiseInquiryAnswerCreateMutation } from '../api/useFranchiseInquiryAnswerCreateMutation'
import { useFranchiseInquiryAnswerSendMutation } from '../api/useFranchiseInquiryAnswerSendMutation'
import { useFranchiseInquiryAnswerUpdateMutation } from '../api/useFranchiseInquiryAnswerUpdateMutation'
import { inquiryAnswerSchema, type InquiryAnswerFormValues } from '../model/inquiryAnswerSchema'
import type { FranchiseInquiryAnswer } from '../model/franchise'

interface FranchiseInquiryAnswerFormProps {
  inquiryId: number
  answer: FranchiseInquiryAnswer | undefined
}

export function FranchiseInquiryAnswerForm({ inquiryId, answer }: FranchiseInquiryAnswerFormProps) {
  const createMutation = useFranchiseInquiryAnswerCreateMutation()
  const updateMutation = useFranchiseInquiryAnswerUpdateMutation()
  const sendMutation = useFranchiseInquiryAnswerSendMutation()

  const form = useZodForm(inquiryAnswerSchema, {
    defaultValues: { answer: answer?.content ?? '' },
  })
  const {
    register,
    formState: { errors, isSubmitting },
  } = form

  async function handleSubmit(values: InquiryAnswerFormValues) {
    if (answer) {
      await updateMutation.mutateAsync({ inquiryId, answer: values.answer })
      toast.success('답변을 수정했습니다')
      return
    }
    await createMutation.mutateAsync({ inquiryId, answer: values.answer })
    toast.success('답변 초안을 저장했습니다')
  }

  function handleSend() {
    sendMutation.mutate(inquiryId, {
      onSuccess: () => {
        toast.success('답변을 발송했습니다')
      },
      onError: (error) => {
        handleApiError(error, { toast })
      },
    })
  }

  return (
    <form
      noValidate
      onSubmit={submitWithErrorMapping(form, handleSubmit)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="franchise-inquiry-answer-textarea">답변 내용</Label>
        <Textarea
          id="franchise-inquiry-answer-textarea"
          rows={5}
          aria-invalid={!!errors.answer}
          {...register('answer')}
        />
        {errors.answer && (
          <p role="alert" className="text-sm text-destructive">
            {errors.answer.message}
          </p>
        )}
      </div>

      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {answer ? '수정 저장' : '초안 저장'}
        </Button>

        {answer && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" disabled={sendMutation.isPending}>
                발송
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>답변을 발송하시겠습니까?</AlertDialogTitle>
                <AlertDialogDescription>
                  발송하면 더 이상 답변을 수정할 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={sendMutation.isPending}>돌아가기</AlertDialogCancel>
                <AlertDialogAction onClick={handleSend} disabled={sendMutation.isPending}>
                  {sendMutation.isPending ? '발송 중...' : '발송'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </form>
  )
}
