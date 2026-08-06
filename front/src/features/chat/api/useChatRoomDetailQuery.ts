import { useQuery } from '@tanstack/react-query'
import { chatKeys } from '../model/queryKeys'
import { getChatRoomDetail } from './getChatRoomDetail'

export function useChatRoomDetailQuery(roomId: number | undefined) {
  return useQuery({
    queryKey: chatKeys.detail(roomId),
    queryFn: () => getChatRoomDetail(roomId as number),
    enabled: roomId != null,
  })
}
