import { useEffect } from 'react'
import { submitWithErrorMapping, useZodForm } from '@/shared/lib/form'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { useAdjustCompensatoryGrantDaysMutation } from '../api/useAdjustCompensatoryGrantDaysMutation'
import { useAdjustSpecialGrantDaysMutation } from '../api/useAdjustSpecialGrantDaysMutation'
import { adjustGrantDaysSchema, type AdjustGrantDaysFormValues } from '../model/adjustGrantDaysSchema'
import type { AdjustGrantDaysTarget } from '../model/leave'

interface AdjustGrantDaysDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: AdjustGrantDaysTarget | null
}

const LEAVE_KIND_LABEL: Record<AdjustGrantDaysTarget['leaveKind'], string> = {
  SPECIAL: '특별',
  COMPENSATORY: '포상',
}

export function AdjustGrantDaysDialog({ open, onOpenChange, target }: AdjustGrantDaysDialogProps) {
  const specialMutation = useAdjustSpecialGrantDaysMutation()
  const compensatoryMutation = useAdjustCompensatoryGrantDaysMutation()
  const mutation = target?.leaveKind === 'COMPENSATORY' ? compensatoryMutation : specialMutation

  const form = useZodForm(adjustGrantDaysSchema)
  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({ plusMinusDays: undefined })
    } else {
      reset()
    }
  }, [open, target, reset])

  async function handleSubmit(values: AdjustGrantDaysFormValues) {
    if (!target) {
      return
    }
    await mutation.mutateAsync({ empId: target.empId, plusMinusDays: values.plusMinusDays })
    onOpenChange(false)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isSubmitting) {
      return
    }
    onOpenChange(nextOpen)
  }

  const kindLabel = target ? LEAVE_KIND_LABEL[target.leaveKind] : ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{kindLabel} 휴가 부여일수 조정</DialogTitle>
          <DialogDescription>
            {target?.empName}님의 {kindLabel} 휴가 부여일수를 증감합니다. 음수를 입력하면 차감됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adjust-grant-days">증감 일수</Label>
            <Input
              id="adjust-grant-days"
              type="number"
              step="0.5"
              placeholder="예: 1.5, -0.5"
              aria-invalid={!!errors.plusMinusDays}
              {...register('plusMinusDays', { valueAsNumber: true })}
            />
            {errors.plusMinusDays && (
              <p role="alert" className="text-sm text-destructive">
                {errors.plusMinusDays.message}
              </p>
            )}
          </div>

          {errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              조정
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
