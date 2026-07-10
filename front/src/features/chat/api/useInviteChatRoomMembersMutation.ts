import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chatKeys } from '../model/queryKeys'
import { inviteChatRoomMembers } from './inviteChatRoomMembers'

/**
 * 채팅방 멤버 초대 mutation 훅(F907, ROADMAP(CHAT) T4.2).
 *
 * roomId는 다이얼로그가 이미 확정해 넘기므로(`useUpdateReadPositionMutation`과 동일하게 훅
 * 정의 시점에 고정) mutate 시점에는 `memberIds`만 넘긴다. 성공(204) 시 `chatKeys.detail(roomId)`만
 * invalidate한다 — `chatKeys.detail(roomId)`는 `chatKeys.messages(roomId)`의 배열 프리픽스라
 * `exact: true` 없이 invalidate하면 TanStack Query 부분매칭으로 메시지 무한스크롤 캐시까지
 * 함께 재조회돼 스크롤 위치가 흔들린다(regression, contract-conformance-reviewer 지적). 반드시
 * `exact: true`로 detail 키만 정확히 무효화한다. 목록 화면의 `joinedMemberCount`는 다음 자연
 * 재조회 시점에 갱신돼도 무방한 부가 정보로 판단해 함께 invalidate하지 않는다.
 *
 * 성공 토스트는 `useCirculationAddMutation`(approval, 공람자 추가)과 동일한 하우스 스타일로 이
 * 훅의 onSuccess에서 띄운다. 실패는 폼 필드가 없어 setError 대상이 없으므로 handleApiError 처리는
 * 호출부(ChatEmployeeListPanel)의 mutate onError에 맡긴다(createChatRoom/toggleBookmark 등 chat
 * 도메인 자체 컨벤션 — 훅은 에러를 그대로 던진다).
 */
export function useInviteChatRoomMembersMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memberIds: number[]) => inviteChatRoomMembers(roomId, { memberIds }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.detail(roomId), exact: true })
      toast.success('멤버를 초대했습니다')
    },
  })
}
