import { useEffect } from 'react'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import { useRejectDraftMutation } from '../../api/useRejectDraftMutation'
import { rejectionSchema, type RejectionFormValues } from '../../model/rejectionSchema'

interface RejectDraftDialogProps {
  /** 반려 대상 기안서 식별 번호(path param). */
  draftId: number
  /** 다이얼로그 열림 상태(제어형, ApproverActions 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 기안서 반려 사유 다이얼로그(F706 `DRAFT_REJECT`, ROADMAP(DRAFT) T3.3).
 *
 * 결재자 현재 차례일 때 [반려] 버튼으로 열린다(노출 판정은 ApproverActions=isMyApprovalTurn).
 * reason(RHF+zod, rejectionSchema — 공백 불가)을 입력받아 반려한다. 성공(204) 시 mutation onSuccess가
 * approvalKeys.all을 invalidate하고 성공 토스트를 띄운 뒤, 이 컴포넌트가 다이얼로그를 닫는다.
 * 닫힐 때마다 폼을 리셋해 다음에 열 때 이전 입력이 남지 않게 한다(제어형이라 명시적 리셋 필요).
 */
export function RejectDraftDialog({ draftId, open, onOpenChange }: RejectDraftDialogProps) {
  const mutation = useRejectDraftMutation()

  const form = useZodForm(rejectionSchema, {
    defaultValues: { reason: '' },
  })
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  async function onValid(values: RejectionFormValues) {
    await mutation.mutateAsync({ draftId, reason: values.reason })
    onOpenChange(false)
  }

  const handleReject = submitWithErrorMapping(form, onValid)

  // 제출 중에는 Esc·오버레이 클릭·닫기를 무시한다(CancellationDraftDialog와 동일 가드) —
  // 제출 도중 닫히면 폼이 reset되어 뒤늦은 실패가 사용자에게 표시되지 않고 삼켜지기 때문이다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>기안서 반려</DialogTitle>
          <DialogDescription>
            반려 사유를 입력하면 기안서가 즉시 반려됩니다. 반려 후에는 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={handleReject} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rejection-reason">
              반려 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="반려 사유를 입력해주세요"
              rows={4}
              aria-invalid={!!errors.reason}
              {...register('reason')}
            />
            {errors.reason && (
              <p role="alert" className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting}>
              반려
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
