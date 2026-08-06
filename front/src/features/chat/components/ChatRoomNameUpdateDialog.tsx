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
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useUpdateChatRoomNameMutation } from '../api/useUpdateChatRoomNameMutation'
import {
  updateChatRoomNameSchema,
  type UpdateChatRoomNameFormValues,
} from '../model/updateChatRoomNameSchema'

interface ChatRoomNameUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
}

export function ChatRoomNameUpdateDialog({
  open,
  onOpenChange,
  roomId,
}: ChatRoomNameUpdateDialogProps) {
  const detailQuery = useChatRoomDetailQuery(roomId)
  const mutation = useUpdateChatRoomNameMutation()
  const form = useZodForm(updateChatRoomNameSchema, { defaultValues: { name: '' } })

  const {
    register,
    reset,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (open) {
      reset({ name: detailQuery.data?.roomName ?? '' })
    }
  }, [open, reset, detailQuery.data?.roomName])

  async function handleSubmit(values: UpdateChatRoomNameFormValues) {
    await mutation.mutateAsync({ roomId, name: values.name })
    toast.success('표시명을 수정했습니다')
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
          <DialogTitle>표시명 수정</DialogTitle>
          <DialogDescription>
            나에게만 보이는 채팅방 표시명을 변경합니다(20자 이하).
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={submitWithErrorMapping(form, handleSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chat-room-name">
              표시명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="chat-room-name"
              maxLength={20}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
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
