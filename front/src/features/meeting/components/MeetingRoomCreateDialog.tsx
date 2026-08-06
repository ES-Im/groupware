import { useEffect } from 'react'
import { useNavigate } from 'react-router'
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
import { useMeetingRoomCreateMutation } from '../api/useMeetingRoomCreateMutation'
import {
  meetingRoomCreateSchema,
  type MeetingRoomCreateFormValues,
} from '../model/meetingRoomCreateSchema'

interface MeetingRoomCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeetingRoomCreateDialog({ open, onOpenChange }: MeetingRoomCreateDialogProps) {
  const navigate = useNavigate()
  const mutation = useMeetingRoomCreateMutation()
  const form = useZodForm(meetingRoomCreateSchema)

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({ name: '', description: '', capacity: undefined })
    } else {
      reset()
    }
  }, [open, reset])

  async function handleSubmit(values: MeetingRoomCreateFormValues) {
    const result = await mutation.mutateAsync(values)
    toast.success('회의실을 등록했습니다')
    onOpenChange(false)
    navigate(`/meeting-rooms/management/${result.meetingRoomId}`)
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
          <DialogTitle>회의실 등록</DialogTitle>
          <DialogDescription>새 회의실의 이름·설명·수용인원을 입력해 등록합니다.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="meeting-room-create-name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-room-create-name"
              placeholder="예: 3층 대회의실"
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
            <Label htmlFor="meeting-room-create-description">
              설명 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="meeting-room-create-description"
              placeholder="회의실 설명을 입력해주세요"
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
            <Label htmlFor="meeting-room-create-capacity">
              수용 인원 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-room-create-capacity"
              type="number"
              min={1}
              step={1}
              placeholder="예: 10"
              aria-invalid={!!errors.capacity}
              {...register('capacity', { valueAsNumber: true })}
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
              등록
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
