import { useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { getMessageDetail } from './getMessageDetail'

export function useMessageDetailQuery(messageId: number | undefined) {
  return useQuery({
    queryKey: messageKeys.detail(messageId),
    queryFn: () => getMessageDetail(messageId as number),
    enabled: messageId != null,
  })
}
