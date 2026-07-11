import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { restoreMessage } from './restoreMessage'

/**
 * 쪽지 휴지통 복구 mutation 훅(`SENT_/RECEIVED_MESSAGE_RESTORE`, F1513, ROADMAP(MESSAGE) T3.4-a).
 *
 * 휴지통 탭/상세 뷰(휴지통 항목)의 명시적 버튼 액션이다(배선은 T3.4-b 몫) — 명시 액션
 * 선례(approval useCirculationReadMutation)를 따라 성공 토스트를 띄운다. 복구는 휴지통·원
 * 메일박스 목록, counts 배지, 상세(isTrashedByMe) 전부에 영향을 주므로 messageKeys.all
 * 단일 invalidate로 stale 화면 리스크를 차단한다. 실패(휴지통 아님 등 서버 최종 판정)는
 * handleApiError로 정규화해 에러 토스트로 노출한다.
 */
export function useMessageRestoreMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, isSentByMe }: { messageId: number; isSentByMe: boolean }) =>
      restoreMessage(messageId, isSentByMe),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
      toast.success('쪽지를 복구했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
