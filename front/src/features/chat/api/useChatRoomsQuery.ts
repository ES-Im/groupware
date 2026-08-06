import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatRooms } from './getChatRooms'

export function useChatRoomsQuery(params?: { keyword?: string; isBookmark?: boolean }) {
  return useQuery({
    queryKey: chatKeys.rooms(params),
    queryFn: () => getChatRooms(params),
    placeholderData: keepPreviousData,
  })
}
