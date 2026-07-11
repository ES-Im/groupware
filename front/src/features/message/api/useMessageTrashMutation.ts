import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { trashMessage } from './trashMessage'

/**
 * 쪽지 휴지통 이동 mutation 훅(`SENT_/RECEIVED_MESSAGE_TRASH`, F1512, ROADMAP(MESSAGE) T3.4-a).
 *
 * 목록 행/상세 뷰의 명시적 버튼 액션이다(배선은 T3.4-b 몫) — 자동 호출이라 성공 토스트를
 * 생략한 useMarkMessageReadMutation과 달리, 명시 액션 선례(approval useCirculationReadMutation)를
 * 따라 성공 토스트를 띄운다. 휴지통 이동은 4박스 목록·counts 배지·상세(isTrashedByMe)
 * 전부에 영향을 주므로 부분 invalidate 조합 대신 messageKeys.all 단일 invalidate로 stale
 * 화면 리스크를 차단한다. 실패(발신/수신자 아님 등 서버 최종 판정)는 handleApiError로
 * 정규화해 에러 토스트로 노출한다.
 */
export function useMessageTrashMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId, isSentByMe }: { messageId: number; isSentByMe: boolean }) =>
      trashMessage(messageId, isSentByMe),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
      toast.success('쪽지를 휴지통으로 이동했습니다')
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
