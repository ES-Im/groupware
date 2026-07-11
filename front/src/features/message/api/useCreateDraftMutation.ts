import { useMutation, useQueryClient } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { createDraft } from './createDraft'
import type { MessageCreateRequest, MessageCreateResult } from './sendMessage'

/**
 * 임시 쪽지 저장 mutation 훅(`MESSAGE_DRAFT_CREATE`, F1507, ROADMAP(MESSAGE) T4.2).
 * 성공(201, `{messageId}`) 시 messageKeys.all을 invalidate해 임시보관함 목록·건수 배지를
 * 한 번에 최신화한다. 실패는 onError 없이 에러를 그대로 전파해 호출부(작성 폼)의
 * submitWithErrorMapping이 handleApiError로 위임하도록 둔다(useLeaveDraftCreateMutation
 * 동형). 저장 후 첨부 업로드 연계(draft-first 오케스트레이션)는 T4.3 범위.
 */
export function useCreateDraftMutation() {
  const queryClient = useQueryClient()

  return useMutation<MessageCreateResult, unknown, MessageCreateRequest>({
    mutationFn: createDraft,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: messageKeys.all })
    },
  })
}
