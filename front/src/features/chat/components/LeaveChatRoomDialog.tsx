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
  /** 다이얼로그 열림 상태(제어형, ChatRoomSettingsMenu 소유 — CreateChatRoomDialog와 동일 패턴). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 채팅방 나가기 확인 다이얼로그(F909, ROADMAP(CHAT) T4.4, §참조 계약 매핑(CHAT_ROOM_LEAVE)).
 *
 * `CHAT_ROOM_LEAVE`는 되돌릴 수 없는 파괴적 동작(재초대 없이는 재입장 불가)이라 shadcn
 * AlertDialog로 실수 클릭을 막는다. `CommentItem`(board 도메인)의 삭제 확인과 동일 컨벤션:
 * `AlertDialogAction` 클릭은 Radix 기본 동작으로 다이얼로그를 즉시 닫고, `handleLeave`는
 * mutate를 fire-and-forget으로 호출해 성공/실패를 이후 토스트로만 알린다(제출 중 닫기 방지
 * 같은 별도 가드를 두지 않음 — 저장소 기존 AlertDialog 확인 패턴 복제).
 *
 * 성공(204) 시 목록 invalidate는 `useLeaveChatRoomMutation`이 담당하고, 이 컴포넌트는 오버레이
 * 스토어의 `backToList`로 목록 패널로 되돌아간다(`useCreateChatRoomMutation`/
 * `CreateChatRoomDialog`와 동일하게 mutation 훅은 캐시 갱신만, 화면 전환은 호출부 책임). 실패는
 * `handleApiError`로 sonner 토스트만 띄운다(다이얼로그는 이미 닫힌 상태 — 재시도는 설정 메뉴에서
 * 다시 연다).
 */
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
