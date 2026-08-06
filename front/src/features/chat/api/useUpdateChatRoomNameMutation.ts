import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { updateChatRoomName } from './updateChatRoomName'

interface UpdateChatRoomNameVariables {
  roomId: number
  name: string
}

export function useUpdateChatRoomNameMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, name }: UpdateChatRoomNameVariables) => updateChatRoomName(roomId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
