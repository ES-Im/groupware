import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { toast } from 'sonner'
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
import { useCreateManualScheduleMutation } from '../api/useCreateManualScheduleMutation'
import {
  manualScheduleCreateSchema,
  type ManualScheduleCreateFormValues,
} from '../model/manualScheduleCreateSchema'
import { scheduleKeys } from '../model/scheduleKeys'

interface ScheduleCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStartAt?: string
}

export function ScheduleCreateDialog({ open, onOpenChange, defaultStartAt }: ScheduleCreateDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useCreateManualScheduleMutation()
  const form = useZodForm(manualScheduleCreateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      const startAt = defaultStartAt ?? ''
      const endAt = defaultStartAt ? dayjs(defaultStartAt).add(1, 'hour').format('YYYY-MM-DDTHH:mm') : ''
      reset({ title: '', content: '', startAt, endAt })
    } else {
      reset()
    }
  }, [open, reset, defaultStartAt])

  async function handleSubmit(values: ManualScheduleCreateFormValues) {
    await mutation.mutateAsync({
      title: values.title,
      content: values.content,
      startAt: `${values.startAt}:00`,
      endAt: `${values.endAt}:00`,
    })
    queryClient.invalidateQueries({ queryKey: scheduleKeys.calendar() })
    toast.success('일정이 등록되었습니다')
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
          <DialogTitle>일정 등록</DialogTitle>
          <DialogDescription>제목·내용과 시작/종료 일시를 입력해 일정을 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-create-title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input id="schedule-create-title" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="schedule-create-content">
              내용 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="schedule-create-content"
              aria-invalid={!!errors.content}
              {...register('content')}
            />
            {errors.content && (
              <p role="alert" className="text-sm text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-create-start">
                시작 일시 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schedule-create-start"
                type="datetime-local"
                aria-invalid={!!errors.startAt}
                {...register('startAt')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="schedule-create-end">
                종료 일시 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="schedule-create-end"
                type="datetime-local"
                aria-invalid={!!errors.endAt}
                {...register('endAt')}
              />
            </div>
          </div>
          {(errors.startAt ?? errors.endAt) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.startAt?.message ?? errors.endAt?.message}
            </p>
          )}

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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
