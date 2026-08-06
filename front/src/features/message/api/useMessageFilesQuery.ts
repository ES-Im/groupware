import { useQuery } from '@tanstack/react-query'
import { messageKeys } from '../model/messageKeys'
import { getMessageFiles } from './getMessageFiles'

export function useMessageFilesQuery(messageId: number | undefined) {
  return useQuery({
    queryKey: messageKeys.files(messageId),
    queryFn: () => getMessageFiles(messageId as number),
    enabled: messageId != null,
  })
}
