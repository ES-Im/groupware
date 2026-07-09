import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Archive, FileText, Inbox, Send } from 'lucide-react'
import dayjs from 'dayjs'
import { toast } from 'sonner'
import { normalizeApiError } from '@/shared/lib/apiError'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { boardKeys } from '../model/queryKeys'
import { useBoardDraftsQuery } from '../api/useBoardDraftsQuery'
import { useBoardPublishMutation } from '../api/useBoardPublishMutation'

/**
 * 내 임시저장함 페이지(F308/F306, ROADMAP T15.1, docs/prd/4.board-slice-prd.md §내 임시저장함 페이지).
 *
 * 여정상 마지막 마일스톤으로, 신규 API/훅을 만들지 않고 T12.1(`useBoardDraftsQuery`)·T11.4
 * (`useBoardPublishMutation`)를 그대로 재사용하는 순수 조립 슬라이스다(ROADMAP 명시). 서버가
 * `GET /api/my/boards/drafts`에서 이미 요청자 본인의 임시저장 글만 반환하므로(getBoardDrafts.ts
 * 주석 참조), 이 화면에는 본인 아님/404 분기 UX가 필요하지 않다 — 조회 실패는 일괄 토스트로 알린다.
 *
 * 각 행은 제목/최근 수정 시각을 보여주는 클릭 영역(→ `/boards/:boardId/edit` 이어쓰기, BoardCreatePage
 * "임시저장글 불러오기" 토글과 동일한 명시적 클릭 이동 패턴)과, 그 옆에 나란히 배치된 별도의 "발행"
 * 버튼(중첩 인터랙티브 엘리먼트를 피하기 위해 형제 엘리먼트로 분리)으로 구성한다.
 *
 * 발행 성공 시 `boardKeys.all`(['board']) 전체를 invalidate한다 — `useBoardPublishMutation` 자체는
 * `boardKeys.detail(boardId)`만 책임지므로(재사용 훅 원본 주석 참조), 이 페이지가 필요로 하는
 * "목록·임시저장함 캐시 동시 갱신"은 소비 시점(`mutate` 호출부)에서 더 넓은 `boardKeys.all`
 * invalidate로 얹는다(ROADMAP 설계 의도 그대로 소비, 신규 무효화 로직 발명 아님).
 *
 * 발행 권한 위반은 403이 아닌 401(`ROLE_002`, `PermissionDeniedException`)로 온다(publishBoard.ts
 * 주석 참조) — 표준 `handleApiError`를 쓰면 토큰무효 분기(로그인 리다이렉트)를 타 사용자가 아무
 * 피드백 없이 로그인 페이지로 튕길 수 있다. BoardDetailPage(T11.4)의 발행 버튼과 동일하게
 * `handleApiError`를 거치지 않고 항상 에러 메시지를 그대로 토스트로만 노출한다(신규 해결책 발명 금지).
 *
 * 발행 성공 후에는 상세로 자동 이동하지 않고 이 목록에 머무르며 재조회만 한다(BoardCreatePage/
 * BoardEditPage의 "성공 후 목록으로" 일관성 — 발행된 글은 게시판 목록에서 찾아가면 된다).
 */
export function BoardDraftsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const draftsQuery = useBoardDraftsQuery()
  const drafts = draftsQuery.data ?? []
  const publishMutation = useBoardPublishMutation()

  // 본인 것만 반환되는 목록이라 not-found/403 전용 UX가 필요 없다 — 실패는 일괄 토스트로 알린다.
  useEffect(() => {
    if (!draftsQuery.error) {
      return
    }
    toast.error(normalizeApiError(draftsQuery.error).message)
  }, [draftsQuery.error])

  function handleRowClick(boardId: number) {
    navigate(`/boards/${boardId}/edit`)
  }

  function handlePublish(boardId: number) {
    publishMutation.mutate(boardId, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: boardKeys.all })
        toast.success('게시글을 발행했습니다')
      },
      // WHY: 소유권 위반 시 백엔드 실측은 403이 아닌 401(ROLE_002)을 반환한다(publishBoard.ts
      // 주석 참조) — handleApiError의 토큰무효 분기(로그인 리다이렉트)를 타면 사용자가 조용히
      // 로그아웃되는 것처럼 보일 수 있어, BoardDetailPage와 동일하게 항상 토스트로만 알린다.
      onError: (error) => {
        toast.error(normalizeApiError(error).message)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-semibold tracking-tight">임시저장함</h1>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5">
            <Archive className="size-4" />
            내 임시저장 글
          </CardTitle>
          <CardDescription>제목을 눌러 이어서 작성하거나, 바로 발행할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {draftsQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</p>
          ) : draftsQuery.error ? (
            // 로드 실패는 위 useEffect가 토스트로 이미 알렸지만, 토스트는 시간이 지나면 사라지므로
            // BoardListPage/BoardDetailPage와 동일하게 "빈 목록"과 구분되는 전용 문구를 렌더한다
            // (그렇지 않으면 drafts=[]로 빠져 "임시저장한 글이 없습니다"와 오구분될 수 있다).
            <p className="py-8 text-center text-sm text-muted-foreground">
              임시저장 글 목록을 불러오지 못했습니다.
            </p>
          ) : drafts.length === 0 ? (
            // 빈 상태: 아이콘 + 안내 문구로 "실패"가 아닌 "아직 없음"임을 시각적으로 분명히 한다.
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-8 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">임시저장한 글이 없습니다.</p>
            </div>
          ) : (
            <ul className="flex flex-col divide-y">
              {drafts.map((draft) => {
                const isPublishingThis =
                  publishMutation.isPending && publishMutation.variables === draft.boardId

                return (
                  <li key={draft.boardId} className="flex items-center gap-3 py-3">
                    <button
                      type="button"
                      onClick={() => handleRowClick(draft.boardId)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{draft.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {dayjs(draft.updatedAt).format('YYYY-MM-DD HH:mm')}
                        </span>
                      </span>
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPublishingThis}
                      onClick={() => handlePublish(draft.boardId)}
                    >
                      <Send />
                      발행
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
