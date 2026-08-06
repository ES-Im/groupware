import dayjs from 'dayjs'
import { Link } from 'react-router'
import { useEmployeeQuery } from '@/features/employee/api/useEmployeeQuery'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { getActiveProfilePicture } from '@/shared/lib/activeFiles'
import type { MessagesResponse } from '../model/messageTypes'

interface UnreadMessageRowProps {
  message: MessagesResponse
}

export function UnreadMessageRow({ message }: UnreadMessageRowProps) {
  const employeeQuery = useEmployeeQuery(message.senderId)
  const fileId = employeeQuery.data ? getActiveProfilePicture(employeeQuery.data.activeFiles) : undefined

  return (
    <Link
      to="/messages/received"
      role="row"
      className="flex items-center gap-2.5 px-2 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <span role="cell" className="shrink-0">
        <BlobAvatar empId={message.senderId} fileId={fileId} fallbackText={message.senderName} className="size-8" />
      </span>
      <span role="cell" className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{message.title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{message.senderName}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 tabular-nums">
            {message.sentAt ? dayjs(message.sentAt).format('YYYY-MM-DD HH:mm') : '-'}
          </span>
        </span>
      </span>
    </Link>
  )
}
