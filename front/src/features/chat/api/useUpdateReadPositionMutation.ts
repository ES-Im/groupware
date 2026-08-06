import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { updateChatRoomReadPosition } from './updateChatRoomReadPosition'

export function useUpdateReadPositionMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lastReadMessageId: number) =>
      updateChatRoomReadPosition(roomId, lastReadMessageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'rooms'] })
    },
  })
}
