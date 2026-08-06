import { useState } from 'react'
import { CornerDownRight, Pencil, Reply as ReplyIcon, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { BlobAvatar } from '@/shared/components/BlobAvatar'
import { handleApiError } from '@/shared/lib/apiError'
import { cn } from '@/shared/lib/utils'
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
import { Button } from '@/shared/ui/button'
import { useCommentDeleteMutation } from '../api/useCommentDeleteMutation'
import { useCommentReplyMutation } from '../api/useCommentReplyMutation'
import { useCommentUpdateMutation } from '../api/useCommentUpdateMutation'
import type { BoardComment } from '../model/board'
import type { CommentFormValues } from '../model/commentSchema'
import { CommentForm } from './CommentForm'

interface CommentItemProps {
  boardId: number
  comment: BoardComment
  allowReply: boolean
  indented?: boolean
}

export function CommentItem({ boardId, comment, allowReply, indented }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const replyMutation = useCommentReplyMutation()
  const updateMutation = useCommentUpdateMutation()
  const deleteMutation = useCommentDeleteMutation()

  const myEmpId: number | undefined = undefined
  const isOwner = myEmpId !== undefined && comment.writerEmpId === myEmpId

  async function handleReplySubmit(values: CommentFormValues) {
    await replyMutation.mutateAsync({ boardId, parentCommentId: comment.commentId, payload: values })
    toast.success('답글을 등록했습니다')
    setIsReplying(false)
  }

  async function handleEditSubmit(values: CommentFormValues) {
    await updateMutation.mutateAsync({ boardId, commentId: comment.commentId, payload: values })
    toast.success('댓글을 수정했습니다')
    setIsEditing(false)
  }

  function handleDelete() {
    deleteMutation.mutate(
      { boardId, commentId: comment.commentId },
      {
        onSuccess: () => toast.success('댓글을 삭제했습니다'),
        onError: (error) => {
          handleApiError(error, { toast })
        },
      },
    )
  }

  const containerClass = cn(
    'rounded-lg border border-border p-3',
    indented ? 'ml-6 border-border/60 bg-muted/30 sm:ml-10' : 'bg-card',
  )

  if (comment.isDeleted) {
    return (
      <article className={containerClass}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground italic">
          {indented && <CornerDownRight className="size-4 shrink-0 not-italic" aria-hidden="true" />}
          삭제된 댓글입니다.
        </div>
      </article>
    )
  }

  return (
    <article className={containerClass}>
      <div className="flex gap-3">
        {indented && (
          <CornerDownRight className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        <BlobAvatar
          empId={comment.writerEmpId ?? undefined}
          fileId={undefined}
          fallbackText={comment.writerEmpName ?? '?'}
          className={cn('size-8', indented && 'size-7 text-[11px]')}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
              <span className="font-medium text-foreground">{comment.writerEmpName}</span>
              {comment.registerAt && (
                <span className="text-xs text-muted-foreground">
                  {dayjs(comment.registerAt).format('YYYY-MM-DD HH:mm')}
                </span>
              )}
              {comment.isEdited && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  수정됨
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {allowReply && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsReplying((prev) => !prev)}
                  aria-pressed={isReplying}
                  title="답글"
                >
                  <ReplyIcon />
                  <span className="sr-only">답글</span>
                </Button>
              )}
              {isOwner && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsEditing((prev) => !prev)}
                    aria-pressed={isEditing}
                    title="수정"
                  >
                    <Pencil />
                    <span className="sr-only">수정</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm" title="삭제">
                        <Trash2 />
                        <span className="sr-only">삭제</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>댓글을 삭제하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                          삭제한 댓글은 되돌릴 수 없습니다. 화면에는 &quot;삭제된 댓글입니다.&quot;로
                          표시됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>삭제</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentForm
                initialContent={comment.content ?? ''}
                submitLabel="수정"
                onCancel={() => setIsEditing(false)}
                onSubmit={handleEditSubmit}
                autoFocus
              />
            </div>
          ) : (
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {comment.content}
            </p>
          )}

          {isReplying && (
            <div className="mt-3 border-t pt-3">
              <CommentForm
                submitLabel="답글 등록"
                placeholder="답글을 입력해주세요"
                onCancel={() => setIsReplying(false)}
                onSubmit={handleReplySubmit}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
