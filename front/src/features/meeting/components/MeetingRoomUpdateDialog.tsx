import { useEffect } from 'react'
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
import type { UpdateMeetingRoomPayload } from '../api/updateMeetingRoom'
import { useMeetingRoomUpdateMutation } from '../api/useMeetingRoomUpdateMutation'
import type { MeetingRoomDetail } from '../model/meeting'
import { meetingRoomUpdateSchema, type MeetingRoomUpdateFormValues } from '../model/meetingRoomUpdateSchema'

interface MeetingRoomUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meetingRoomId: number
  detail: MeetingRoomDetail
}

function buildUpdatePayload(
  values: MeetingRoomUpdateFormValues,
  detail: MeetingRoomDetail,
): UpdateMeetingRoomPayload {
  const payload: UpdateMeetingRoomPayload = {}
  if (values.name !== undefined && values.name !== detail.name) {
    payload.name = values.name
  }
  if (values.description !== undefined && values.description !== detail.description) {
    payload.description = values.description
  }
  if (values.capacity !== undefined && values.capacity !== detail.capacity) {
    payload.capacity = values.capacity
  }
  return payload
}

export function MeetingRoomUpdateDialog({ open, onOpenChange, meetingRoomId, detail }: MeetingRoomUpdateDialogProps) {
  const mutation = useMeetingRoomUpdateMutation()
  const form = useZodForm(meetingRoomUpdateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({ name: detail.name, description: detail.description, capacity: detail.capacity })
    } else {
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  async function handleSubmit(values: MeetingRoomUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ meetingRoomId, payload })
    toast.success('회의실 정보를 수정했습니다')
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
          <DialogTitle>회의실 정보 수정</DialogTitle>
          <DialogDescription>바꾸고 싶은 항목만 고쳐 저장합니다. 변경한 값이 없으면 저장할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-name">이름</Label>
            <Input
              id="meeting-room-update-name"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-description">설명</Label>
            <Textarea
              id="meeting-room-update-description"
              aria-invalid={!!errors.description}
              {...register('description')}
            />
            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-update-capacity">수용 인원</Label>
            <Input
              id="meeting-room-update-capacity"
              type="number"
              min={1}
              step={1}
              aria-invalid={!!errors.capacity}
              {...register('capacity', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
            />
            {errors.capacity && (
              <p role="alert" className="text-sm text-destructive">
                {errors.capacity.message}
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
              저장
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
