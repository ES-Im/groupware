import { useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { getMailboxCounts } from './getMailboxCounts'

export function useMailboxCountsQuery() {
  return useQuery({
    queryKey: messageKeys.counts(),
    queryFn: getMailboxCounts,
  })
}
