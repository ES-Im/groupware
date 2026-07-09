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
  /** 최상위 댓글에만 true — 대댓글에는 답글 버튼을 노출하지 않는다(F315, 재대댓글 금지·1-depth 제한). */
  allowReply: boolean
  /** 대댓글 렌더용 들여쓰기 여부. */
  indented?: boolean
}

/**
 * 댓글/대댓글 한 항목(ROADMAP T14.2, F313~F317).
 *
 * `isDeleted=true`(소프트 삭제, F317)면 서버가 writerEmpId/writerEmpName/content/registerAt/
 * isEdited를 전부 null로 되돌리므로(model/board.ts BoardComment 주석 참조) 원 내용 대신
 * "삭제된 댓글입니다."만 표시하고 답글/수정/삭제 버튼도 전부 숨긴다.
 */
export function CommentItem({ boardId, comment, allowReply, indented }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const replyMutation = useCommentReplyMutation()
  const updateMutation = useCommentUpdateMutation()
  const deleteMutation = useCommentDeleteMutation()

  // //todo(§리스크7 동형 공백 — 본인 식별 불가): RETRIEVE_ME_INFO(features/employee/model/me.ts)
  // 에는 numeric empId가 없어 댓글 작성자 본인 여부를 클라에서 판별할 방법이 현재 없다.
  // BoardDetailPage.tsx의 canEdit 게이팅은 이 공백을 ADMIN 대체 조건으로 우회했지만, 여기서는
  // 그 우회를 그대로 복제하지 않는다 — §열린항목2 각주(COMMENT_DELETE 계약 권한 "댓글 작성자" vs
  // 도메인모델 "작성자 또는 관리자" 불일치)가 ADMIN 확장 로직을 임의로 추가하지 말라고 명시하기
  // 때문이다(서버가 403을 내리면 그대로 권한부족 UX로 처리하고, 클라는 확장하지 않는다). numeric
  // 본인 식별자 소스가 확정되면 아래 myEmpId를 실제 값으로 채우고 isOwner 비교를 활성화해야
  // 한다 — 확정 전에는 항상 false(수정/삭제 버튼 비노출)로 둔다.
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
        // 활성 사원 아님/권한 위반(403) 등 모든 실패를 T0.2c 표준 분기로 위임한다(전용 UX 없이 토스트).
        onError: (error) => {
          handleApiError(error, { toast })
        },
      },
    )
  }

  // 대댓글(indented)은 좌측 들여쓰기 + muted 배경 + 연결 아이콘(CornerDownRight)으로 부모와의
  // 종속 관계를 시각적으로 드러낸다. 최상위 댓글은 카드 배경(bg-card)으로 또렷하게 구분한다.
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
        {/* 답글임을 나타내는 연결 아이콘(대댓글에만). */}
        {indented && (
          <CornerDownRight className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
        {/* 작성자 아바타 — writerEmpId만 넘기고 fileId는 미전달해 이니셜 폴백을 쓴다(부서장 행과
            동일 패턴, 별도 파일 조회 없음). 대댓글은 한 단계 작은 아바타로 위계를 표현한다. */}
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
              {/* isOwner는 위 //todo 사유로 현재 항상 false — 이 두 버튼은 사실상 아직 노출되지 않는다. */}
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
