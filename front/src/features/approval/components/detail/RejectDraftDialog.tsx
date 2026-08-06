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
  draftId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
