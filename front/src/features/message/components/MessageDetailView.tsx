import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'
import { ArrowLeft, Reply, Trash2, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { isForbidden, isNotFound, normalizeApiError } from '@/shared/lib/apiError'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Separator } from '@/shared/ui/separator'
import { useMarkMessageReadMutation } from '../api/useMarkMessageReadMutation'
import { useMessageDetailQuery } from '../api/useMessageDetailQuery'
import type { MailBox } from '../model/messageTypes'
import { MessageAttachmentSection } from './MessageAttachmentSection'

function formatMessageDateTime(value: string | null): string {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '미발송'
}

function formatPersonName(deptName: string | null, name: string): string {
  return deptName ? `${deptName} ${name}` : name
}

interface MessageDetailActionsProps {
  box: MailBox
  isTrashedByMe: boolean
  onReply?: () => void
  onTrash?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

function MessageDetailActions({
  box,
  isTrashedByMe,
  onReply,
  onTrash,
  onRestore,
  onDelete,
}: MessageDetailActionsProps) {
  if (box === 'drafts') {
    return null
  }

  if (box === 'trash') {
    if (!isTrashedByMe) {
      return null
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestore}
          disabled={onRestore == null}
        >
          <Undo2 />
          복구
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm" disabled={onDelete == null}>
              <Trash2 />
              완전 삭제
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>쪽지를 완전 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>삭제한 쪽지는 복구할 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {box === 'received' && (
        <Button type="button" size="sm" onClick={onReply} disabled={onReply == null}>
          <Reply />
          답장
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onTrash}
        disabled={onTrash == null}
      >
        <Trash2 />
        휴지통 이동
      </Button>
    </div>
  )
}

interface MessageDetailViewProps {
  messageId: number
  box: MailBox
  onBack: () => void
  onReply?: () => void
  onTrash?: () => void
  onRestore?: () => void
  onDelete?: () => void
}

export function MessageDetailView({
  messageId,
  box,
  onBack,
  onReply,
  onTrash,
  onRestore,
  onDelete,
}: MessageDetailViewProps) {
  const detailQuery = useMessageDetailQuery(messageId)
  const { mutate: markRead } = useMarkMessageReadMutation()
  const autoReadMessageIdRef = useRef<number | null>(null)

  const detail = detailQuery.data

  useEffect(() => {
    if (box !== 'received' || detail == null) {
      return
    }
    if (autoReadMessageIdRef.current === messageId) {
      return
    }
    autoReadMessageIdRef.current = messageId
    markRead(messageId)
  }, [box, messageId, detail, markRead])

  useEffect(() => {
    if (!detailQuery.error) {
      return
    }
    const apiError = normalizeApiError(detailQuery.error)
    if (!isNotFound(apiError) && !isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [detailQuery.error])

  const backButton = (
    <Button type="button" variant="outline" size="sm" onClick={onBack}>
      <ArrowLeft />
      목록으로
    </Button>
  )

  if (detailQuery.isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div className="xl:hidden">{backButton}</div>
        <p className="py-8 text-center text-sm text-muted-foreground">쪽지를 불러오는 중...</p>
      </div>
    )
  }

  if (detailQuery.error) {
    const apiError = normalizeApiError(detailQuery.error)
    const guidance = isNotFound(apiError)
      ? '쪽지를 찾을 수 없습니다. 삭제되었거나 접근할 수 없는 쪽지입니다.'
      : isForbidden(apiError)
        ? '이 쪽지를 조회할 권한이 없습니다.'
        : '쪽지를 불러오지 못했습니다.'
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10">
        <p className="text-sm text-muted-foreground">{guidance}</p>
        <div className="xl:hidden">{backButton}</div>
      </div>
    )
  }

  if (detail == null) {
    return null
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="xl:hidden">{backButton}</div>

      <Card className="flex min-w-0 flex-1 flex-col">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b">
          <CardTitle className="min-w-0 text-xl font-bold tracking-tight break-all text-foreground">
            {detail.title}
          </CardTitle>
          <div className="shrink-0">
            <MessageDetailActions
              box={box}
              isTrashedByMe={detail.isTrashedByMe}
              onReply={onReply}
              onTrash={onTrash}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="shrink-0 space-y-2.5 text-sm">
            <div className="flex items-start gap-3">
              <span className="w-16 shrink-0 pt-1 text-muted-foreground">보낸사람</span>
              <span className="rounded-md bg-muted px-2.5 py-1 font-medium text-foreground">
                {formatPersonName(detail.senderDeptName, detail.senderName)}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-16 shrink-0 pt-1 text-muted-foreground">받는사람</span>
              {detail.receivers.length === 0 ? (
                <span className="pt-1 text-muted-foreground">지정된 수신자가 없습니다.</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {detail.receivers.map((receiver) => (
                    <span
                      key={receiver.receiverId}
                      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1"
                    >
                      <span className="font-medium text-foreground">
                        {formatPersonName(receiver.receiverDeptName, receiver.receiverName)}
                      </span>
                      {box === 'sent' &&
                        (receiver.isRead ? (
                          <Badge variant="secondary">읽음</Badge>
                        ) : (
                          <Badge variant="outline">미열람</Badge>
                        ))}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatMessageDateTime(detail.sentAt)}
            </p>
          </div>

          <Separator className="shrink-0" />

          <section className="flex min-h-0 flex-[7] flex-col gap-2">
            <h3 className="shrink-0 text-sm font-semibold text-muted-foreground">내용</h3>
            <div className="min-h-0 flex-1 overflow-y-auto text-sm leading-7 break-words whitespace-pre-wrap text-foreground">
              {detail.content}
            </div>
          </section>

          <Separator className="shrink-0" />

          <div className="min-h-0 flex-[3] overflow-y-auto">
            <MessageAttachmentSection messageId={messageId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
