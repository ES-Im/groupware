import { useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
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

interface CommentSectionProps {
  boardId: number
}

/**
 * 게시글 상세 댓글 영역(ROADMAP T14.2, F313~F317, docs/prd/4.board-slice-prd.md §게시글 상세
 * 페이지). BoardDetailPage.tsx 하단에 마운트한다.
 *
 * 댓글 목록(F313)은 `parentCommentId` 유무로만 1-depth 스타일(들여쓰기·답글 버튼 노출 여부)을
 * 결정하고, 페이지에 도착한 댓글 배열은 서버가 내려준 순서 그대로 전부 렌더링한다 —
 * "부모를 찾아 그 아래에 묶는" 그룹핑은 하지 않는다. 백엔드(`BoardQueryRepositoryAdapter`)는
 * 순수 `createdAt asc` 정렬만 하고 부모-자식을 같은 페이지로 묶어주지 않으므로, 부모가 이전
 * 페이지로 밀려난 대댓글이 있을 수 있다 — 그런 대댓글도 "부모를 못 찾았다"는 이유로 누락하지
 * 않고 시간순 위치 그대로 독립적으로 표시한다(데이터 유실 방지 우선, 부모 바로 아래에 시각적으로
 * 붙지 않을 수 있는 것은 이 페이지네이션 구조상 감내하는 트레이드오프). 대댓글(`parentCommentId`
 * 존재)에는 `allowReply=false`로 답글 버튼을 숨겨 재대댓글을 막는다(F315, 1-depth 제한).
 *
 * 페이징은 신규 UI를 만들지 않고 T10.1 표준(`usePageState`+`PaginationControls`, BoardListPage와
 * 동일 소비 패턴)을 그대로 재사용한다.
 *
 * 등록/대댓글/수정/삭제 4종 mutation은 성공 시 `onCommentMutationSuccess`(T14.1)가 이미
 * `boardKeys.comments(...)`를 invalidate하고 `boardKeys.detail(boardId)`의 `commentCount`를
 * 로컬 델타로 갱신하므로, 이 컴포넌트는 별도로 commentCount를 계산/갱신하지 않는다.
 */
export function CommentSection({ boardId }: CommentSectionProps) {
  const { page, size, onPageChange } = usePageState()
  const commentsQuery = useBoardCommentsQuery(boardId, { page, size })
  const registerMutation = useCommentRegisterMutation()

  const comments = commentsQuery.data?.content ?? []

  // 403(권한 위반)은 아래에서 전용 문구로 렌더하므로 토스트에서는 제외한다(BoardDetailPage와
  // 동일 컨벤션). 활성 사원이 아닌 경우 등 그 외 실패는 토스트로만 알린다.
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

  return (
    <Card className="mt-6">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-1.5 text-base">
          <MessageCircle className="size-4" />
          댓글 {pageInfo.totalElements}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentForm submitLabel="등록" onSubmit={handleRegisterSubmit} />

        {/* 로딩 → 조회 실패(403 전용 문구, 그 외 실패는 "불러오지 못했습니다." 전용 문구 —
            BoardListPage.tsx의 not-found 외 실패 분기 관행과 동일) → 빈 목록 → 목록 순서대로 분기.
            실패를 빈 목록으로 오표시하지 않도록 error 분기를 length===0 분기보다 먼저 둔다. */}
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
          <div className="space-y-2 border-t pt-4">
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
    </Card>
  )
}
