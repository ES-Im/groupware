import { useInfiniteQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatMessages } from './getChatMessages'

const PAGE_SIZE = 50

export function useChatMessagesQuery(roomId: number | undefined) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(roomId),
    queryFn: ({ pageParam }) =>
      getChatMessages(roomId as number, { cursor: pageParam, size: PAGE_SIZE }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? (lastPage.nextCursor ?? undefined) : undefined),
    enabled: roomId != null,
  })
}
