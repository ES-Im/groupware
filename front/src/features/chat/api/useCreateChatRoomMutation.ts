import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'
import { chatKeys } from '../model/queryKeys'
import { createChatRoom, type CreateChatRoomPayload } from './createChatRoom'

export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient()

  return useMutation<RegisterDomainIdResponse, unknown, CreateChatRoomPayload>({
    mutationFn: createChatRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
