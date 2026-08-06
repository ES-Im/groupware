import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { leaveChatRoom } from './leaveChatRoom'

export function useLeaveChatRoomMutation(roomId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveChatRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...chatKeys.all, 'rooms'] })
    },
  })
}
