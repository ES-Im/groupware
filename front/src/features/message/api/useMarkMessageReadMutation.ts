import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleApiError } from '@/shared/lib/apiError'
import { messageKeys } from '../model/messageKeys'
import { markMessageRead } from './markMessageRead'

/**
 * 받은 쪽지 읽음 처리 mutation 훅(`RECEIVED_MESSAGE_READ`, F1511, ROADMAP(MESSAGE) T3.1).
 *
 * 받은쪽지 상세 진입 시 자동 호출되는 백그라운드 액션이다 — "받은쪽지일 때만 호출"이라는
 * 조건부 배선은 상세 뷰 UI(T3.3)가 담당하고, 이 훅은 정의와 invalidate까지만 책임진다.
 * 성공(204) 시 messageKeys.all을 invalidate해 목록 isRead·안읽음 배지(counts)를 갱신한다.
 * 명시적 버튼 액션인 approval useCirculationReadMutation과 달리 자동 호출이므로 성공
 * 토스트는 생략하고, 실패(수신자 아님 등 서버 최종 판정)만 handleApiError로 정규화해
 * 에러 토스트로 노출한다.
 */
export function useMarkMessageReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => markMessageRead(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
    onError: (error) => {
      handleApiError(error, { toast })
    },
  })
}
