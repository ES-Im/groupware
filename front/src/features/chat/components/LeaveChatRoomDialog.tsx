import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { useLeaveChatRoomMutation } from '../api/useLeaveChatRoomMutation'
import { useChatOverlayStore } from '../lib/chatOverlayStore'

interface LeaveChatRoomDialogProps {
  roomId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeaveChatRoomDialog({ roomId, open, onOpenChange }: LeaveChatRoomDialogProps) {
  const backToList = useChatOverlayStore((state) => state.backToList)
  const mutation = useLeaveChatRoomMutation(roomId)

  function handleLeave() {
    mutation.mutate(undefined, {
      onSuccess: () => {
        backToList()
        toast.success('채팅방에서 나갔습니다.')
      },
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>채팅방에서 나가시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            나가면 대화 목록에서 사라지며, 다시 초대받기 전까지 재입장할 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleLeave}>
            나가기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
