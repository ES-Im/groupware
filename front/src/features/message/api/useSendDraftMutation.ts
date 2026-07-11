import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { sendDraft } from './sendDraft'

/**
 * 임시 쪽지 발송 mutation 훅(`MESSAGE_DRAFT_SEND`, F1515, ROADMAP(MESSAGE) T4.3-a).
 *
 * 첨부 draft-first 오케스트레이션(T4.3-b)의 최종 발송 단계와 임시보관함 발송(T5.3)이 공용
 * 소비한다. onError를 정의하지 않아 에러가 그대로 전파된다 — 호출부의 submitWithErrorMapping이
 * 실패 처리를 위임받는다(자동 백그라운드 액션이라 훅이 직접 토스트하는
 * useMarkMessageReadMutation과 구분되는 지점).
 *
 * 성공 시 messageKeys.all을 invalidate해 임시보관함·보낸함 목록과 counts 배지가 함께
 * 갱신되도록 한다.
 */
export function useSendDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (messageId: number) => sendDraft(messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
