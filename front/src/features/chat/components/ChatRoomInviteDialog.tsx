import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EmployeePicker, type EmployeePickerEmployee } from '@/features/approval/components/EmployeePicker'
import { handleApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { useChatRoomDetailQuery } from '../api/useChatRoomDetailQuery'
import { useInviteChatRoomMembersMutation } from '../api/useInviteChatRoomMembersMutation'

interface ChatRoomInviteDialogProps {
  /** 초대 대상 채팅방 식별 번호. */
  roomId: number
  /** 다이얼로그 열림 상태(제어형, ChatRoomSettingsMenu 소유). */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 멤버 초대 다이얼로그(F907, ROADMAP(CHAT) T4.2, `CHAT_ROOM_INVITE`).
 *
 * 대상 사원 검색·다중 선택은 T3.1-a 산출물(`EmployeePicker`, approval 도메인 cross-feature 재사용 —
 * `CreateChatRoomDialog`와 동일 컨벤션, 신규 사원 검색 UI 발명 금지)을 그대로 쓴다. 이미 방에 있는
 * 멤버는 다시 초대할 수 없으므로 `disabledEmpIds`로 제외한다 — roomId만 prop으로 받고
 * `useChatRoomDetailQuery(roomId)`를 이 컴포넌트가 직접 호출해 현재 멤버 목록
 * (`members[].memberId`)을 구한다. `ChatRoomDetailPage`가 이미 같은 queryKey로 상세를 로드해 둔
 * 상태라 캐시를 그대로 재사용하며 별도 네트워크 요청이 추가되지 않는다. `ChatRoomSettingsMenu`에
 * roomId 외의 새 prop을 추가하지 않는 이유는, 동시에 다른 작업이 그 컴포넌트의 표시명 수정(T4.3)·
 * 나가기(T4.4) 항목을 건드릴 수 있어 시그니처 변경으로 인한 충돌 여지를 없애기 위함이다.
 *
 * `CirculationAddDialog`(approval)와 동일한 제어형 패턴: 다이얼로그가 닫히면 선택을 리셋하고,
 * 제출 중(`mutation.isPending`)에는 닫기를 무시해 뒤늦은 실패가 삼켜지지 않게 한다. 빈 선택
 * (`memberIds.length === 0`)이면 초대 버튼을 비활성화해 계약상 "필수, 빈 배열 불가"를 클라에서
 * 선제 차단한다. 성공(204) 시 mutation 훅의 onSuccess(chatKeys.detail invalidate + 토스트)가
 * 상세(참여자 목록)를 갱신하고, 이 다이얼로그는 닫기만 담당한다. 실패는 handleApiError로 에러
 * 토스트만 띄우고 다이얼로그는 열린 채로 유지해 재시도할 수 있게 한다(CreateChatRoomDialog와 동일).
 */
export function ChatRoomInviteDialog({ roomId, open, onOpenChange }: ChatRoomInviteDialogProps) {
  const [selected, setSelected] = useState<EmployeePickerEmployee[]>([])
  const detailQuery = useChatRoomDetailQuery(roomId)
  const existingMemberIds = detailQuery.data?.members.map((member) => member.memberId) ?? []
  const mutation = useInviteChatRoomMembersMutation(roomId)

  useEffect(() => {
    if (!open) {
      setSelected([])
    }
  }, [open])

  const memberIds = selected.map((emp) => emp.empId)

  function handleInvite() {
    if (memberIds.length === 0) {
      return
    }
    mutation.mutate(memberIds, {
      // 닫히면 useEffect(!open)가 선택을 리셋하므로 여기서 별도 setSelected는 두지 않는다.
      onSuccess: () => {
        onOpenChange(false)
      },
      onError: (error) => handleApiError(error, { toast }),
    })
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && mutation.isPending) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>멤버 초대</DialogTitle>
          <DialogDescription>이 채팅방에 초대할 사원을 선택합니다(최소 1명).</DialogDescription>
        </DialogHeader>

        <EmployeePicker
          selected={selected}
          onChange={setSelected}
          disabledEmpIds={existingMemberIds}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleInvite}
            disabled={mutation.isPending || memberIds.length === 0}
          >
            {mutation.isPending ? '초대 중...' : `초대${memberIds.length > 0 ? ` (${memberIds.length})` : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
