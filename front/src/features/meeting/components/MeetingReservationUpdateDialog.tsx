import { useEffect, useState } from 'react'
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
import type { MeetingReservationUpdatePayload } from '../api/updateMeetingReservationInfo'
import { useUpdateMeetingReservationMutation } from '../api/useUpdateMeetingReservationMutation'
import {
  MeetingRoomSearchAndSelect,
  type ConfirmedMeetingSearchParams,
} from './MeetingRoomSearchAndSelect'
import type { MeetingReservationDetail, MeetingRoomSummary } from '../model/meeting'
import {
  meetingReservationUpdateSchema,
  type MeetingReservationUpdateFormValues,
} from '../model/meetingReservationUpdateSchema'

interface MeetingReservationUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  detail: MeetingReservationDetail
}

function buildUpdatePayload(
  values: MeetingReservationUpdateFormValues,
  detail: MeetingReservationDetail,
): MeetingReservationUpdatePayload {
  const payload: MeetingReservationUpdatePayload = {}
  if (values.title !== undefined && values.title !== detail.title) {
    payload.title = values.title
  }
  if (values.meetingDate !== undefined && values.meetingDate !== detail.meetingDate) {
    payload.meetingDate = values.meetingDate
  }
  if (values.startAt !== undefined && values.startAt !== detail.startAt) {
    payload.startAt = values.startAt
  }
  if (values.endAt !== undefined && values.endAt !== detail.endAt) {
    payload.endAt = values.endAt
  }
  if (values.meetingRoomId !== undefined && values.meetingRoomId !== detail.meetingRoomId) {
    payload.meetingRoomId = values.meetingRoomId
  }
  return payload
}

export function MeetingReservationUpdateDialog({ open, onOpenChange, detail }: MeetingReservationUpdateDialogProps) {
  const mutation = useUpdateMeetingReservationMutation()
  const [isChangingRoom, setIsChangingRoom] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomSummary | undefined>(undefined)

  const form = useZodForm(meetingReservationUpdateSchema, {
    defaultValues: { title: '', meetingDate: '', startAt: '', endAt: '', meetingRoomId: undefined },
  })
  const {
    register,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = form

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      reset({
        title: detail.title,
        meetingDate: detail.meetingDate,
        startAt: detail.startAt,
        endAt: detail.endAt,
        meetingRoomId: detail.meetingRoomId,
      })
      setIsChangingRoom(false)
      setSelectedRoom(undefined)
    } else {
      reset()
    }
  }, [open])

  function handleRoomSelected(room: MeetingRoomSummary | undefined, confirmed?: ConfirmedMeetingSearchParams) {
    setSelectedRoom(room)
    if (room && confirmed) {
      setValue('meetingRoomId', room.meetingRoomId, { shouldValidate: true })
      setValue('meetingDate', confirmed.date, { shouldValidate: true })
      setValue('startAt', confirmed.startAt, { shouldValidate: true })
      setValue('endAt', confirmed.endAt, { shouldValidate: true })
    } else {
      setValue('meetingRoomId', detail.meetingRoomId, { shouldValidate: true })
      setValue('meetingDate', detail.meetingDate, { shouldValidate: true })
      setValue('startAt', detail.startAt, { shouldValidate: true })
      setValue('endAt', detail.endAt, { shouldValidate: true })
    }
  }

  function handleToggleRoomChange() {
    if (isChangingRoom) {
      if (selectedRoom) {
        setValue('meetingDate', detail.meetingDate, { shouldValidate: true })
        setValue('startAt', detail.startAt, { shouldValidate: true })
        setValue('endAt', detail.endAt, { shouldValidate: true })
      }
      setSelectedRoom(undefined)
      setValue('meetingRoomId', detail.meetingRoomId)
    }
    setIsChangingRoom((prev) => !prev)
  }

  async function handleSubmit(values: MeetingReservationUpdateFormValues) {
    const payload = buildUpdatePayload(values, detail)
    await mutation.mutateAsync({ meetingId: detail.meetingId, payload })
    toast.success('예약 정보를 수정했습니다')
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>예약 정보 수정</DialogTitle>
          <DialogDescription>회의일·시각·제목을 고치거나 회의실을 변경합니다.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={submitWithErrorMapping(form, handleSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-update-title">회의 제목</Label>
            <Input id="meeting-update-title" aria-invalid={!!errors.title} {...register('title')} />
            {errors.title && (
              <p role="alert" className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-date">회의일</Label>
              <Input id="meeting-update-date" type="date" aria-invalid={!!errors.meetingDate} {...register('meetingDate')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-start">시작 시각</Label>
              <Input id="meeting-update-start" type="time" aria-invalid={!!errors.startAt} {...register('startAt')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meeting-update-end">종료 시각</Label>
              <Input id="meeting-update-end" type="time" aria-invalid={!!errors.endAt} {...register('endAt')} />
            </div>
          </div>
          {(errors.meetingDate ?? errors.startAt ?? errors.endAt) && (
            <p role="alert" className="text-sm text-destructive">
              {errors.meetingDate?.message ?? errors.startAt?.message ?? errors.endAt?.message}
            </p>
          )}

          <div className="flex flex-col gap-3 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm">
                회의실 <span className="text-muted-foreground">{detail.meetingRoomName}</span>
                {selectedRoom && (
                  <span className="text-foreground"> → {selectedRoom.name}(으)로 변경 예정</span>
                )}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={handleToggleRoomChange}>
                {isChangingRoom ? '회의실 변경 취소' : '회의실 변경'}
              </Button>
            </div>
            {isChangingRoom && (
              <MeetingRoomSearchAndSelect onRoomSelected={handleRoomSelected} showRoomDetailLink={false} />
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
