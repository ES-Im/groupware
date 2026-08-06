import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { createChatRoom, type CreateChatRoomPayload, type CreateChatRoomResult } from './createChatRoom'

export function useCreateChatRoomMutation() {
  const queryClient = useQueryClient()

  return useMutation<CreateChatRoomResult, unknown, CreateChatRoomPayload>({
    mutationFn: createChatRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
