import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import type { MailBox } from '../model/messageTypes'
import { getMessages, type MessageListQueryParams } from './getMessages'

export function useMessagesQuery(box: MailBox, params?: MessageListQueryParams) {
  return useQuery({
    queryKey: messageKeys.list(box, params),
    queryFn: () => getMessages(box, params),
    placeholderData: keepPreviousData,
  })
}
