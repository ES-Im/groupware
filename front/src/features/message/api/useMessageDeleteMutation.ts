import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { deleteMessage } from './deleteMessage'

/**
 * 쪽지 완전 삭제 mutation 훅(`SENT_/RECEIVED_MESSAGE_DELETE`, F1514, ROADMAP(MESSAGE) T3.4-a).
 *
 * 휴지통 탭/상세 뷰(휴지통 항목)의 명시적 버튼 액션이다 — 파괴적 액션이므로 확인
 * AlertDialog를 거쳐 호출하는 배선은 T3.4-b 몫이고, 이 훅은 정의·invalidate·피드백까지만
 * 책임진다. 명시 액션 선례(approval useCirculationReadMutation)를 따라 성공 토스트를
 * 띄우고, 삭제는 휴지통 목록·counts 배지·상세 전부에 영향을 주므로 messageKeys.all 단일
 * invalidate로 stale 화면 리스크를 차단한다. 실패(휴지통 아님 등 서버 최종 판정)는
 * handleApiError로 정규화해 에러 토스트로 노출한다.
 */
export function useMessageDeleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, isSentByMe }: { messageId: number; isSentByMe: boolean }) =>
      deleteMessage(messageId, isSentByMe),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
      toast.success('쪽지를 완전 삭제했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
