import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { bookmarkChatRoom } from './bookmarkChatRoom'
import { unbookmarkChatRoom } from './unbookmarkChatRoom'

interface ToggleBookmarkVariables {
  roomId: number
  isBookmarked: boolean
}

export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ roomId, isBookmarked }: ToggleBookmarkVariables) =>
      isBookmarked ? unbookmarkChatRoom(roomId) : bookmarkChatRoom(roomId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: chatKeys.all })
    },
  })
}
