import dayjs from 'dayjs'
import { Link } from 'react-router'
import { ArrowRight, Mail, MailOpen } from 'lucide-react'
import { useMessagesQuery } from '@/features/message/api/useMessagesQuery'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card'

const WIDGET_ITEM_LIMIT = 3

export function UnreadMessagesWidget() {
  const { data } = useMessagesQuery('received', { isRead: false, page: 0, size: WIDGET_ITEM_LIMIT })
  const items = data?.content ?? []

  return (
    <Card className="h-[420px]">
      <CardHeader className="flex shrink-0 items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
          <Mail />
        </span>
        <div>
          <CardTitle>안읽은 쪽지함</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">미확인 쪽지</p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
              <MailOpen />
            </span>
            <p className="text-sm text-muted-foreground">안읽은 쪽지가 없습니다.</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.messageId}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
                {item.senderName.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-sm text-muted-foreground">{item.senderName}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <time className="text-xs text-muted-foreground">
                  {item.sentAt ? dayjs(item.sentAt).format('MM-DD HH:mm') : '-'}
                </time>
                <span className="size-2 rounded-full bg-primary" aria-hidden />
              </div>
            </div>
          ))
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Link
          to="/messages"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          쪽지함 보기
          <ArrowRight className="size-3.5" />
        </Link>
      </CardFooter>
    </Card>
  )
}
