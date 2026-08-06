import { useEffect } from 'react'
import dayjs from 'dayjs'
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
import { Textarea } from '@/shared/ui/textarea'
import { useUpdateAttendanceMutation } from '../api/useUpdateAttendanceMutation'
import type { AttendanceEditTarget } from '../model/deptAttendance'
import { updateAttendanceSchema, type UpdateAttendanceFormValues } from '../model/updateAttendanceSchema'

interface UpdateAttendanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: AttendanceEditTarget | null
}

export function UpdateAttendanceDialog({ open, onOpenChange, target }: UpdateAttendanceDialogProps) {
  const mutation = useUpdateAttendanceMutation()
  const form = useZodForm(updateAttendanceSchema, {
    defaultValues: { targetEmpId: 0, startAt: '', endAt: '', editReason: '' },
  })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open && target) {
      reset({
        targetEmpId: target.targetEmpId,
        startAt: target.startAt ?? '',
        endAt: target.endAt ?? '',
        editReason: '',
      })
    } else if (!open) {
      reset()
    }
  }, [open, target, reset])

  async function handleSubmit(values: UpdateAttendanceFormValues) {
    if (!target) {
      return
    }
    await mutation.mutateAsync({
      attendanceId: target.attendanceId,
      payload: { ...values, editedAt: dayjs().format('YYYY-MM-DDTHH:mm:ss') },
    })
    onOpenChange(false)
  }

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
          <DialogTitle>근태 수정</DialogTitle>
          <DialogDescription>
            출퇴근 시각과 수정 사유를 입력해 근태 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-start-at">시작 시각</Label>
            <Input
              id="attendance-start-at"
              type="time"
              step={1}
              aria-invalid={!!errors.startAt}
              {...register('startAt')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-end-at">종료 시각</Label>
            <Input
              id="attendance-end-at"
              type="time"
              step={1}
              aria-invalid={!!errors.endAt}
              {...register('endAt')}
            />
          </div>

          {errors.startAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startAt.message}
            </p>
          )}
          {errors.endAt && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endAt.message}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="attendance-edit-reason">
              수정 사유 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="attendance-edit-reason"
              placeholder="수정 사유를 입력해주세요"
              maxLength={100}
              aria-invalid={!!errors.editReason}
              className="min-h-16"
              {...register('editReason')}
            />
            {errors.editReason && (
              <p role="alert" className="text-sm text-destructive">
                {errors.editReason.message}
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
              수정
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
