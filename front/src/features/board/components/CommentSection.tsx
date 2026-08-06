import { useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/features/auth/store/authStore'
import { isForbidden, normalizeApiError } from '@/shared/lib/apiError'
import type { PageMeta } from '@/shared/components/PaginationControls'
import { PaginationControls } from '@/shared/components/PaginationControls'
import { usePageState } from '@/shared/lib/usePageState'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { useBoardCommentsQuery } from '../api/useBoardCommentsQuery'
import { useCommentRegisterMutation } from '../api/useCommentRegisterMutation'
import type { CommentFormValues } from '../model/commentSchema'
import { CommentForm } from './CommentForm'
import { CommentItem } from './CommentItem'
import { InitialsAvatar } from './InitialsAvatar'

interface CommentSectionProps {
  boardId: number
  variant?: 'standalone' | 'embedded'
}

export function CommentSection({ boardId, variant = 'standalone' }: CommentSectionProps) {
  const { page, size, onPageChange } = usePageState()
  const commentsQuery = useBoardCommentsQuery(boardId, { page, size })
  const registerMutation = useCommentRegisterMutation()
  const myName = useAuthStore((state) => state.user?.empBasicInfo.name) ?? '나'

  const comments = commentsQuery.data?.content ?? []

  useEffect(() => {
    if (!commentsQuery.error) {
      return
    }
    const apiError = normalizeApiError(commentsQuery.error)
    if (!isForbidden(apiError)) {
      toast.error(apiError.message)
    }
  }, [commentsQuery.error])

  async function handleRegisterSubmit(values: CommentFormValues) {
    await registerMutation.mutateAsync({ boardId, payload: values })
    toast.success('댓글을 등록했습니다')
  }

  const pageInfo: PageMeta = commentsQuery.data ?? {
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size,
    numberOfElements: 0,
    first: true,
    last: true,
  }

  const body = (
    <>
      <CardHeader className={variant === 'embedded' ? 'border-t pt-(--card-spacing)' : 'border-b'}>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <MessageCircle className="size-4" />
          댓글 {pageInfo.totalElements}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <InitialsAvatar name={myName} />
          <div className="min-w-0 flex-1">
            <CommentForm submitLabel="등록" onSubmit={handleRegisterSubmit} />
          </div>
        </div>

        {commentsQuery.isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">불러오는 중...</p>
        ) : commentsQuery.error ? (
          isForbidden(normalizeApiError(commentsQuery.error)) ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              댓글을 조회할 권한이 없습니다.
            </p>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              댓글을 불러오지 못했습니다.
            </p>
          )
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">등록된 댓글이 없습니다.</p>
        ) : (
          <div className="space-y-3 border-t pt-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                boardId={boardId}
                comment={comment}
                allowReply={comment.parentCommentId == null}
                indented={comment.parentCommentId != null}
              />
            ))}
          </div>
        )}

        <PaginationControls
          className="border-t pt-4"
          pageInfo={pageInfo}
          page={page}
          onPageChange={onPageChange}
          unit="개"
        />
      </CardContent>
    </>
  )

  if (variant === 'embedded') {
    return body
  }

  return <Card className="mt-6">{body}</Card>
}
